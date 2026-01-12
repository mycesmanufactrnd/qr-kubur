import z from "zod";
import { AppDataSource } from "../datasource.ts";
import { PaymentField } from "../db/entities.ts";
import { paymentFieldSchema } from "../schemas/paymentFieldSchema.ts";
import { router, superAdminProcedure } from "../trpc.ts";

export const paymentFieldRouter = router({
  getField: superAdminProcedure
    .query(() => {
      const fieldRepo = AppDataSource.getRepository(PaymentField);
      return fieldRepo.find({
        relations: ['paymentplatform']
      });
    }),

  create: superAdminProcedure
    .input(paymentFieldSchema)
    .mutation(async ({ input }) => {
      const fieldRepo = AppDataSource.getRepository(PaymentField);

      const platform = fieldRepo.create(input);

      return await fieldRepo.save(platform);
    }),
  
  update: superAdminProcedure
    .input(z.object({ id: z.number(), data: paymentFieldSchema }))
    .mutation(async ({ input }) => {
      const fieldRepo = AppDataSource.getRepository(PaymentField);
      const platform = await fieldRepo.findOneByOrFail({ id: input.id });

      fieldRepo.merge(platform, input.data);

      return await fieldRepo.save(platform);
    }),

  delete: superAdminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const fieldRepo = AppDataSource.getRepository(PaymentField);
      return fieldRepo.delete(input);
    }),
});