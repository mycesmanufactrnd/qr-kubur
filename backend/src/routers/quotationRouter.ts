// @ts-nocheck
import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { GoogleUserRecord, Quotation } from "../db/entities.js";
import { quotationSchema } from "../schemas/quotationSchema.js";
import { QuotationStatus } from "../db/enums.js";
import { sendNotificationFCMToOrganisation } from "../services/firebase.service.js";

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

      if (input.organisation?.id) {
        await sendNotificationFCMToOrganisation({
          organisationId: input.organisation.id,
          event: "quotation_created",
          inputData: { selectedservices: input.selectedservices },
        });
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
        filterStatus: z.nativeEnum(QuotationStatus).optional().nullable(),
        filterService: z.string().optional().nullable(),
        dateFrom: z.string().optional().nullable(),
        dateTo: z.string().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const { page = 1, pageSize = 10, currentUserOrganisation, isSuperAdmin, filterStatus, filterService, dateFrom, dateTo } = input;
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

      if (filterStatus) {
        qb.andWhere("quotation.status = :status", { status: filterStatus });
      }

      if (filterService) {
        qb.andWhere("LOWER(CAST(quotation.selectedservices AS TEXT)) LIKE :service", {
          service: `%${filterService.toLowerCase()}%`,
        });
      }

      if (dateFrom) {
        qb.andWhere("quotation.createdat >= :dateFrom", { dateFrom: new Date(dateFrom) });
      }

      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        qb.andWhere("quotation.createdat <= :dateTo", { dateTo: end });
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
