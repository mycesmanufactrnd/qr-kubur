import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { Quotation } from "../db/entities.ts";
import { quotationSchema } from "../schemas/quotationSchema.ts";

export const quotationRouter = router({
  create: publicProcedure
    .input(quotationSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Quotation);
      const quotation = repo.create(input);
      return repo.save(quotation);
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
