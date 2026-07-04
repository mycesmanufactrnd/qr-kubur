// @ts-nocheck
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { DeadPerson } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import { deadPersonSchema } from "../schemas/deadpersonSchema.js";

const stripIcDashes = (value) =>
  typeof value === "string" ? value.replace(/-/g, "").trim() : value;

export const deadPersonRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterIC: z.string().optional(),
        filterGrave: z.number().optional(),
        filterGraveLot: z.string().optional(),
        filterState: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        organisationIds: z.array(z.number()).optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterName,
        filterIC,
        filterGrave,
        filterGraveLot,
        filterState,
        dateFrom,
        dateTo,
        organisationIds,
        sortField,
        sortOrder,
      } = input;

      const repo = AppDataSource.getRepository(DeadPerson);

      const query = repo
        .createQueryBuilder("deadperson")
        .leftJoinAndSelect("deadperson.grave", "grave");

      if (organisationIds && organisationIds.length > 0) {
        query.andWhere("grave.organisationId IN (:...ids)", {
          ids: organisationIds,
        });
      }

      if (filterName?.trim()) {
        query.andWhere("deadperson.name ILIKE :name", {
          name: `%${filterName.trim()}%`,
        });
      }

      if (filterIC?.trim()) {
        query.andWhere("deadperson.icnumber ILIKE :ic", {
          ic: `%${filterIC.trim()}%`,
        });
      }

      if (filterGrave) {
        query.andWhere("deadperson.graveId = :graveId", {
          graveId: filterGrave,
        });
      }

      if (filterGraveLot?.trim()) {
        query.andWhere("deadperson.gravelot ILIKE :gravelot", {
          gravelot: `%${filterGraveLot.trim()}%`,
        });
      }

      if (filterState && filterState !== "all") {
        query.andWhere("grave.state = :state", { state: filterState });
      }

      if (dateFrom && dateTo) {
        query.andWhere("deadperson.dateofdeath BETWEEN :dateFrom AND :dateTo", {
          dateFrom,
          dateTo,
        });
      } else if (dateFrom) {
        query.andWhere("deadperson.dateofdeath >= :dateFrom", { dateFrom });
      } else if (dateTo) {
        query.andWhere("deadperson.dateofdeath <= :dateTo", { dateTo });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const allowedSortFields: Record<string, string> = {
        name: "deadperson.name",
        dateofdeath: "deadperson.dateofdeath",
        icnumber: "deadperson.icnumber",
      };
      const orderCol = (sortField && allowedSortFields[sortField]) || "deadperson.id";
      const orderDir = sortOrder === "ASC" ? "ASC" : "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(deadPersonSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      const deadPersonRepo = AppDataSource.getRepository(DeadPerson);

      const person = deadPersonRepo.create({
        ...input,
        icnumber: stripIcDashes(input.icnumber),
        createdbyId: Number(ctx.user.id),
      });

      return await deadPersonRepo.save(person);
    }),

  upsertForQariah: protectedProcedure
    .input(deadPersonSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) throw new Error("Unauthorized");
      const repo = AppDataSource.getRepository(DeadPerson);

      const icnumber = stripIcDashes(input.icnumber);

      let existing: DeadPerson | null = null;
      if (icnumber) {
        existing = await repo.findOne({ where: { icnumber } });
      }

      if (existing) {
        repo.merge(existing, { ...input, icnumber });
        return await repo.save(existing);
      }

      const person = repo.create({
        ...input,
        icnumber,
        createdbyId: Number(ctx.user.id),
      });
      return await repo.save(person);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deadPersonSchema }))
    .mutation(async ({ input }) => {
      const deadPersonRepo = AppDataSource.getRepository(DeadPerson);
      const person = await deadPersonRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      if (cleanedInput.icnumber !== undefined) {
        cleanedInput.icnumber = stripIcDashes(cleanedInput.icnumber);
      }

      deadPersonRepo.merge(person, cleanedInput);

      return await deadPersonRepo.save(person);
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const repo = AppDataSource.getRepository(DeadPerson);
    return await repo.delete(input);
  }),

  getByIcNumber: publicProcedure
    .input(z.object({ icnumber: z.string() }))
    .query(async ({ input }) => {
      if (!input.icnumber) return null;
      return await AppDataSource.getRepository(DeadPerson).findOne({
        where: { icnumber: stripIcDashes(input.icnumber) },
        relations: ["grave"],
      });
    }),

  getDeadPersonById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;

      return await AppDataSource.getRepository(DeadPerson).findOne({
        where: { id: input.id },
        relations: ["grave", "grave.organisation"],
      });
    }),

  getDeadPersonByGraveId: publicProcedure
    .input(z.object({ graveId: z.number() }))
    .query(async ({ input }) => {
      if (!input.graveId) return null;

      return await AppDataSource.getRepository(DeadPerson).find({
        where: { grave: { id: input.graveId } },
        relations: ["grave"],
      });
    }),
});
