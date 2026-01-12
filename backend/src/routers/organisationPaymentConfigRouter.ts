import { protectedProcedure, router } from '../trpc.ts';
import { OrganisationPaymentConfig } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const organisationPaymentConfigRouter = router({
  getConfigByOrganisationId: protectedProcedure
    .input(
      z.object({
        organisation: z.object({ id: z.number() }).nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.organisation?.id) {
        return [];
      }

      return await AppDataSource
        .getRepository(OrganisationPaymentConfig)
        .find({
          where: {
            organisation: { id: input.organisation.id },
          },
          relations: ['paymentplatform', 'paymentfield']
        });
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        organisationId: z.number(),
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
      const repo = AppDataSource.getRepository(OrganisationPaymentConfig);

      for (const cfg of input.configs) {
        const existing = await repo.findOne({
          where: {
            organisation: { id: input.organisationId },
            paymentplatform: { id: cfg.paymentPlatformId },
            paymentfield: { id: cfg.paymentFieldId },
          },
          relations: ['organisation', 'paymentplatform', 'paymentfield'],
        });

        if (existing) {
          // update
          existing.value = cfg.value;
          await repo.save(existing);
        } else {
          // insert
          await repo.save(
            repo.create({
              organisation: { id: input.organisationId },
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