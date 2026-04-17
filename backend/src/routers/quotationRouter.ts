import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { GoogleUserRecord, Quotation } from "../db/entities.ts";
import { quotationSchema } from "../schemas/quotationSchema.ts";
import { QuotationStatus } from "../db/enums.ts";

export const quotationRouter = router({
  create: publicProcedure
    .input(quotationSchema.extend({
      googleuserId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const quotationRepo = AppDataSource.getRepository(Quotation);
      const quotation = quotationRepo.create(input);
      const savedQuotation = await quotationRepo.save(quotation);

      if (input.googleuserId) {
        const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);
        const record = userRecordRepo.create({
          entityname: "quotation",
          entityid: savedQuotation.id,
          referenceno: savedQuotation.referenceno,
          status: savedQuotation.status,
          googleuser: { id: input.googleuserId },
        });

        await userRecordRepo.save(record);
      }

      return savedQuotation;
    }),

  getByReferenceNo: publicProcedure
    .input(z.object({ referenceno: z.string() }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Quotation);
      return repo.findOne({
        where: { referenceno: input.referenceno },
        relations: ["organisation", "deadperson"],
      });
    }),

  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        pageSize: z.number().min(1).optional().default(10),
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { page = 1, pageSize = 10, currentUserOrganisation, isSuperAdmin } = input;
      const quotationRepo = AppDataSource.getRepository(Quotation);

      const qb = quotationRepo
        .createQueryBuilder("quotation")
        .leftJoinAndSelect("quotation.organisation", "organisation")
        .leftJoinAndSelect("quotation.deadperson", "deadperson")
        .orderBy("quotation.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize);

      if (!isSuperAdmin) {
        if (!currentUserOrganisation) return { items: [], total: 0 };
        qb.where("quotation.organisationId = :orgId", { orgId: currentUserOrganisation });
      }

      const [items, total] = await qb.getManyAndCount();
      return { items, total };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          status: z.nativeEnum(QuotationStatus).optional(),
          photourl: z.string().optional().nullable(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const quotationRepo = AppDataSource.getRepository(Quotation);
      const quotation = await quotationRepo.findOneByOrFail({ id: input.id });
      quotationRepo.merge(quotation, input.data);
      return quotationRepo.save(quotation);
    }),
});
