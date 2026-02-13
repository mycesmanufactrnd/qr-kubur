import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharityPayment } from "../db/entities.ts";
import { deathCharityPaymentSchema } from "../schemas/deathCharityPaymentSchema.ts";

export const deathCharityPaymentRouter = router({
  getPaymentByMemberId: publicProcedure
    .input(z.object({
        memberId: z.number(),
    }))
    .query(async ({ input }) => {
      const paymentRepo = AppDataSource.getRepository(DeathCharityPayment);

      return await paymentRepo.find({
        where: { 
          member: { 
            id: input.memberId 
          } 
        },
      });
    }),

  create: publicProcedure
    .input(deathCharityPaymentSchema)
    .mutation(async ({ input }) => {
      const paymentRepo = AppDataSource.getRepository(DeathCharityPayment);
      const payment = paymentRepo.create(input);
      return await paymentRepo.save(payment);
    }),
});