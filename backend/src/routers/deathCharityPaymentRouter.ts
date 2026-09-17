// @ts-nocheck
import z from "zod";
import { publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { DeathCharityPayment, GoogleUserRecord } from "../db/entities.js";
import { deathCharityPaymentSchema } from "../schemas/deathCharityPaymentSchema.js";
import { rateLimited } from "../middleware/rateLimit.js";

export const deathCharityPaymentRouter = router({
  getByReferenceNo: rateLimited(
    20,
    60 * 1000,
    "Too many requests. Please try again shortly.",
  )
    .input(z.object({ referenceno: z.string() }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeathCharityPayment);
      return repo.findOne({
        where: { referenceno: input.referenceno },
        select: {
          id: true,
          referenceno: true,
          amount: true,
          paymenttype: true,
          paymentmethod: true,
          coversfromyear: true,
          coverstoyear: true,
          paidat: true,
          member: {
            id: true,
            fullname: true,
            deathcharity: {
              id: true,
              organisation: { id: true, name: true },
            },
          },
        },
        relations: {
          member: { deathcharity: { organisation: true } },
        },
      });
    }),

  getPaymentByMemberId: rateLimited(
    5,
    60 * 1000,
    "Too many attempts. Please try again later.",
  )
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
