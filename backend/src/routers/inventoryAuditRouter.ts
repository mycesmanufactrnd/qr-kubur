// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import {
  CheckDetail,
  CheckSession,
  InventoryItem,
  InventoryTransaction,
} from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import {
  checkSessionSchema,
  updateCheckDetailSchema,
  updateReusableCheckDetailSchema,
} from "../schemas/checkSessionSchema.js";
import {
  CheckDetailResult,
  CheckSessionStatus,
  InventoryTransactionType,
  InventoryTransactionSource,
  InventoryItemType,
} from "../db/enums.js";
import { TRPCError } from "@trpc/server";
import { computeItemStatus } from "./inventoryItemRouter.js";

export const inventoryAuditRouter = router({
  getSessions: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterStatus: z.nativeEnum(CheckSessionStatus).optional(),
        filterLocation: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filterStatus, filterLocation } = input;

      const repo = AppDataSource.getRepository(CheckSession);
      const query = repo
        .createQueryBuilder("session")
        .leftJoinAndSelect("session.checkedBy", "checkedBy");

      if (filterStatus) {
        query.andWhere("session.status = :status", { status: filterStatus });
      }

      if (filterLocation) {
        query.andWhere("session.location = :location", { location: filterLocation });
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

        // Snapshot only items stored at the audited location.
        const items = await manager.find(InventoryItem, {
          select: ["id", "current_quantity"],
          where: { location: input.location },
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
  // Computes difference and result automatically. While the session is
  // IN_PROGRESS this only records the audit finding — the live InventoryItem
  // is untouched until the session is completed.
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

  // Save the auditor's condition/status check for a reusable item row.
  // Only recorded on the audit while IN_PROGRESS — the live InventoryItem
  // is synced once the session is completed.
  updateReusableCount: protectedProcedure
    .input(updateReusableCheckDetailSchema)
    .mutation(async ({ input }) => {
      const { detailId, condition, reusable_status, notes } = input;

      const repo = AppDataSource.getRepository(CheckDetail);
      const detail = await repo.findOneByOrFail({ id: detailId });

      const session = await AppDataSource.getRepository(CheckSession).findOneBy(
        { id: detail.sessionId },
      );
      if (session?.status === CheckSessionStatus.COMPLETED) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Sesi audit telah selesai. Kiraan tidak boleh dikemaskini.",
        });
      }

      repo.merge(detail, { condition, reusable_status, notes });
      return await repo.save(detail);
    }),

  // Finalise the session: aggregate match/missing/over_count counts, apply
  // every audited row's finding to the live InventoryItem (quantity for
  // consumables, condition/status for reusables, each logged as a stock
  // ADJUSTMENT), then mark as COMPLETED.
  completeSession: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: sessionId, ctx }) => {
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
          relations: ["item"],
        });

        let matched = 0;
        let missing = 0;
        let over_count = 0;

        for (const d of details) {
          if (d.result === CheckDetailResult.MATCH) matched++;
          else if (d.result === CheckDetailResult.MISSING) missing++;
          else if (d.result === CheckDetailResult.OVER_COUNT) over_count++;

          const item = d.item;
          if (!item) continue;

          if (item.item_type === InventoryItemType.REUSABLE) {
            if (d.condition || d.reusable_status) {
              await manager.update(InventoryItem, item.id, {
                condition: d.condition ?? item.condition,
                status: d.reusable_status ?? item.status,
              });
            }
            continue;
          }

          if (d.physical_count === null || d.physical_count === undefined) continue;

          const stockDiff = d.physical_count - item.current_quantity;
          if (stockDiff === 0) continue;

          const newStatus = computeItemStatus(d.physical_count, item.minimum_level, item.item_type);

          await manager.update(InventoryItem, item.id, {
            current_quantity: d.physical_count,
            status: newStatus,
          });

          await manager.save(
            manager.create(InventoryTransaction, {
              transaction_type: InventoryTransactionType.ADJUSTMENT,
              itemId: item.id,
              quantity: stockDiff,
              before_quantity: item.current_quantity,
              after_quantity: d.physical_count,
              source: InventoryTransactionSource.AUDIT,
              notes: d.notes || `Pelarasan stok daripada audit sesi #${sessionId}`,
              createdbyId: Number(ctx.user.id),
            }),
          );
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

  // Reopen a completed session so counts can be updated again.
  reopenSession: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input: sessionId }) => {
      const repo = AppDataSource.getRepository(CheckSession);
      const session = await repo.findOneByOrFail({ id: sessionId });

      if (session.status === CheckSessionStatus.IN_PROGRESS) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Sesi audit sudah dalam proses.",
        });
      }

      await repo.update(sessionId, { status: CheckSessionStatus.IN_PROGRESS });

      return repo.findOne({ where: { id: sessionId }, relations: ["checkedBy"] });
    }),
});
