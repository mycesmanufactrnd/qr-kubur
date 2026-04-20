import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharityPayment, GoogleUserRecord } from "../db/entities.ts";
import { deathCharityPaymentSchema } from "../schemas/deathCharityPaymentSchema.ts";

export const deathCharityPaymentRouter = router({
  getPaymentByMemberId: publicProcedure
    .input(
      z.object({
        memberId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const paymentRepo = AppDataSource.getRepository(DeathCharityPayment);

      return await paymentRepo.find({
        where: {
          member: {
            id: input.memberId,
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      deathCharityPaymentSchema.extend({
        googleuserId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const paymentRepo = AppDataSource.getRepository(DeathCharityPayment);
      const payment = paymentRepo.create(input);

      const savedPayment = await paymentRepo.save(payment);

      if (input.googleuserId) {
        const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);
        const record = userRecordRepo.create({
          entityname: "deathcharity",
          entityid: savedPayment.id,
          referenceno: savedPayment.referenceno,
          status: `${savedPayment.coversfromyear} - ${savedPayment.coverstoyear}`,
          googleuser: { id: input.googleuserId },
        });

        await userRecordRepo.save(record);
      }

      return savedPayment;
    }),
});
