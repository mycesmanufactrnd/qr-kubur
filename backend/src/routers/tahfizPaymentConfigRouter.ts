import { protectedProcedure, router } from '../trpc.ts';
import { TahfizPaymentConfig } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const tahfizPaymentConfigRouter = router({
  getConfigByTahfizId: protectedProcedure
    .input(
      z.object({
        tahfiz: z.object({ id: z.number() }).nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.tahfiz?.id) {
        return [];
      }

      return await AppDataSource
        .getRepository(TahfizPaymentConfig)
        .find({
          where: {
            tahfizcenter: { id: input.tahfiz.id },
          },
          relations: ['paymentplatform', 'paymentfield']
        });
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        tahfizId: z.number(),
        configs: z.array(
          z.object({
            paymentPlatformId: z.number(),
            paymentFieldId: z.number(),
            value: z.string().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizPaymentConfig);

      for (const cfg of input.configs) {
        const existing = await repo.findOne({
          where: {
            tahfizcenter: { id: input.tahfizId },
            paymentplatform: { id: cfg.paymentPlatformId },
            paymentfield: { id: cfg.paymentFieldId },
          },
          relations: ['tahfiz', 'paymentplatform', 'paymentfield'],
        });

        if (existing) {
          existing.value = cfg.value;
          await repo.save(existing);
        } else {
          await repo.save(
            repo.create({
              tahfizcenter: { id: input.tahfizId },
              paymentplatform: { id: cfg.paymentPlatformId },
              paymentfield: { id: cfg.paymentFieldId },
              value: cfg.value,
            })
          );
        }
      }

      return { success: true };
    }),
});