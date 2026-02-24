import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { GoogleUserRecord, Quotation } from "../db/entities.ts";
import { quotationSchema } from "../schemas/quotationSchema.ts";

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
});
