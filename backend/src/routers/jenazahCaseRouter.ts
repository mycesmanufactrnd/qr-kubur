// @ts-nocheck
import { publicProcedure, protectedProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { JenazahCase, DeathCharityMember, Mosque } from "../db/entities.js";
import { JenazahCaseStatus } from "../db/enums.js";
import { z } from "zod";

const sanitizeDetails = (details) => {
  if (!details || typeof details.deceasedIcnumber !== "string") return details;
  return {
    ...details,
    deceasedIcnumber: details.deceasedIcnumber.replace(/-/g, "").trim(),
  };
};

export const jenazahCaseRouter = router({
  create: publicProcedure
    .input(
      z.object({
        mosqueId: z.number().optional().nullable(),
        qariahmemberid: z.number().optional().nullable(),
        details: z.record(z.string(), z.any()),
        userremarks: z.string().optional().nullable(),
        adminremarks: z.string().optional().nullable(),
        deathconfirmationphotourl: z.string().optional().nullable(),
        policereportphotourl: z.string().optional().nullable(),
        supportingphotourl: z.string().optional().nullable(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(JenazahCase);
      const approved = input.autoApprove === true;
      const c = repo.create({
        mosqueId: input.mosqueId ?? null,
        qariahmemberid: input.qariahmemberid ?? null,
        details: sanitizeDetails(input.details),
        status: approved ? JenazahCaseStatus.APPROVED : JenazahCaseStatus.PENDING,
        isapproved: approved,
        userremarks: input.userremarks ?? null,
        adminremarks: input.adminremarks ?? null,
        deathconfirmationphotourl: input.deathconfirmationphotourl ?? null,
        policereportphotourl: input.policereportphotourl ?? null,
        supportingphotourl: input.supportingphotourl ?? null,
      });
      return await repo.save(c);
    }),

  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        status: z.string().optional(),
        mosqueId: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, mosqueId, search } = input;
      const repo = AppDataSource.getRepository(JenazahCase);
      const query = repo
        .createQueryBuilder("jc")
        .leftJoinAndSelect("jc.mosque", "mosque");

      if (status) {
        query.andWhere("jc.status = :status", { status });
      }
      if (mosqueId) {
        query.andWhere("jc.mosqueId = :mosqueId", { mosqueId });
      }
      if (search) {
        query.andWhere(
          "(jc.details->>'deceasedFullname' ILIKE :search OR jc.details->>'deceasedIcnumber' ILIKE :search)",
          { search: `%${search}%` },
        );
      }

      const [items, total] = await query
        .orderBy("jc.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        mosqueId: z.number().optional().nullable(),
        details: z.record(z.string(), z.any()),
        adminremarks: z.string().optional().nullable(),
        deathconfirmationphotourl: z.string().optional().nullable(),
        policereportphotourl: z.string().optional().nullable(),
        supportingphotourl: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(JenazahCase);
      const c = await repo.findOneByOrFail({ id: input.id });
      if (input.mosqueId !== undefined) c.mosqueId = input.mosqueId ?? null;
      c.details = sanitizeDetails(input.details);
      if (input.adminremarks !== undefined) c.adminremarks = input.adminremarks ?? null;
      if (input.deathconfirmationphotourl !== undefined)
        c.deathconfirmationphotourl = input.deathconfirmationphotourl ?? null;
      if (input.policereportphotourl !== undefined)
        c.policereportphotourl = input.policereportphotourl ?? null;
      if (input.supportingphotourl !== undefined)
        c.supportingphotourl = input.supportingphotourl ?? null;
      return await repo.save(c);
    }),

  addToQariah: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const caseRepo = AppDataSource.getRepository(JenazahCase);
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      const c = await caseRepo.findOneByOrFail({ id: input.id });
      const d = c.details ?? {};
      const icRaw = (d.deceasedIcnumber ?? "").replace(/-/g, "");

      // Resolve organisation through the mosque relation
      let organisation = null;
      if (c.mosqueId) {
        const mosque = await AppDataSource.getRepository(Mosque).findOne({
          where: { id: c.mosqueId },
          relations: ["organisation"],
        });
        organisation = mosque?.organisation ?? null;
      }

      const existingMember = icRaw
        ? await memberRepo.findOneBy({ icnumber: icRaw })
        : null;

      if (!existingMember) {
        const member = memberRepo.create({
          fullname: d.deceasedFullname ?? "",
          icnumber: icRaw,
          phone: d.deceasedPhone || null,
          email: d.deceasedEmail || null,
          address: d.deceasedAddress || null,
          isdeceased: true,
          mosqueId: c.mosqueId ?? null,
          organisation: organisation ?? undefined,
          isapproved: true,
        });
        await memberRepo.save(member);
      }

      c.addedtoqariah = true;
      return await caseRepo.save(c);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(JenazahCase);
      await repo.delete(input.id);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          JenazahCaseStatus.PENDING,
          JenazahCaseStatus.APPROVED,
          JenazahCaseStatus.REJECTED,
        ]),
        adminremarks: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(JenazahCase);
      const c = await repo.findOneByOrFail({ id: input.id });
      c.status = input.status;
      c.isapproved = input.status === "approved";
      if (input.adminremarks !== undefined) c.adminremarks = input.adminremarks ?? null;
      return await repo.save(c);
    }),
});
