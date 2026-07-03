// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import { CheckDetail, CheckSession, InventoryItem } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import {
  checkSessionSchema,
  updateCheckDetailSchema,
} from "../schemas/checkSessionSchema.js";
import { CheckDetailResult, CheckSessionStatus } from "../db/enums.js";
import { TRPCError } from "@trpc/server";

export const inventoryAuditRouter = router({
  getSessions: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterStatus: z.nativeEnum(CheckSessionStatus).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filterStatus } = input;

      const repo = AppDataSource.getRepository(CheckSession);
      const query = repo
        .createQueryBuilder("session")
        .leftJoinAndSelect("session.checkedBy", "checkedBy");

      if (filterStatus) {
        query.andWhere("session.status = :status", { status: filterStatus });
      }

      const [items, total] = await query
        .orderBy("session.session_date", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  // Creates a new audit session and snapshots current_quantity for every
  // InventoryItem into CheckDetail rows. All in a single transaction.
  createSession: protectedProcedure
    .input(checkSessionSchema)
    .mutation(async ({ input, ctx }) => {
      return await AppDataSource.transaction(async (manager) => {
        const session = manager.create(CheckSession, {
          location: input.location,
          notes: input.notes,
          checkedById: Number(ctx.user.id),
          status: CheckSessionStatus.IN_PROGRESS,
        });
        const savedSession = await manager.save(session);

        // Snapshot every active item.
        const items = await manager.find(InventoryItem, {
          select: ["id", "current_quantity"],
        });

        const details = items.map((item) =>
          manager.create(CheckDetail, {
            sessionId: savedSession.id,
            itemId: item.id,
            system_quantity: item.current_quantity,
          }),
        );

        await manager.save(details);

        await manager.update(CheckSession, savedSession.id, {
          total_items: items.length,
        });

        return manager.findOne(CheckSession, {
          where: { id: savedSession.id },
          relations: ["checkedBy"],
        });
      });
    }),

  getSessionDetails: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input: sessionId }) => {
      const session = await AppDataSource.getRepository(CheckSession).findOne({
        where: { id: sessionId },
        relations: ["checkedBy"],
      });

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const details = await AppDataSource.getRepository(CheckDetail)
        .createQueryBuilder("detail")
        .leftJoinAndSelect("detail.item", "item")
        .where("detail.sessionId = :sessionId", { sessionId })
        .orderBy("item.item_name", "ASC")
        .getMany();

      return { session, details };
    }),

  // Save the auditor's physical count for a single row.
  // Computes difference and result automatically.
  updateCount: protectedProcedure
    .input(updateCheckDetailSchema)
    .mutation(async ({ input }) => {
      const { detailId, physical_count, notes } = input;

      const repo = AppDataSource.getRepository(CheckDetail);
      const detail = await repo.findOneByOrFail({ id: detailId });

      // Verify the session is still open.
      const session = await AppDataSource.getRepository(CheckSession).findOneBy(
        { id: detail.sessionId },
      );
      if (session?.status === CheckSessionStatus.COMPLETED) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Sesi audit telah selesai. Kiraan tidak boleh dikemaskini.",
        });
      }

      const difference = physical_count - detail.system_quantity;
      let result: CheckDetailResult;
      if (difference === 0) result = CheckDetailResult.MATCH;
      else if (difference < 0) result = CheckDetailResult.MISSING;
      else result = CheckDetailResult.OVER_COUNT;

      repo.merge(detail, { physical_count, difference, result, notes });
      return await repo.save(detail);
    }),

  // Finalise the session: aggregate match/missing/over_count counts,
  // then mark as COMPLETED. No stock adjustments are applied automatically
  // — discrepancies are informational only.
  completeSession: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: sessionId }) => {
      return await AppDataSource.transaction(async (manager) => {
        const session = await manager.findOneByOrFail(CheckSession, {
          id: sessionId,
        });

        if (session.status === CheckSessionStatus.COMPLETED) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Sesi audit sudah selesai.",
          });
        }

        const details = await manager.find(CheckDetail, {
          where: { sessionId },
        });

        let matched = 0;
        let missing = 0;
        let over_count = 0;

        for (const d of details) {
          if (d.result === CheckDetailResult.MATCH) matched++;
          else if (d.result === CheckDetailResult.MISSING) missing++;
          else if (d.result === CheckDetailResult.OVER_COUNT) over_count++;
        }

        await manager.update(CheckSession, sessionId, {
          status: CheckSessionStatus.COMPLETED,
          total_items: details.length,
          matched,
          missing,
          over_count,
        });

        return manager.findOne(CheckSession, {
          where: { id: sessionId },
          relations: ["checkedBy"],
        });
      });
    }),
});
