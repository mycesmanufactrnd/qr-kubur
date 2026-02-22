import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { OrganisationPaymentConfig } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const organisationPaymentConfigRouter = router({
  getConfigByOrganisationId: publicProcedure
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

      const existingConfigs = await repo.find({
        where: { organisation: { id: input.organisationId } },
        relations: ['organisation', 'paymentplatform', 'paymentfield'],
      });

      const upsertKeys = new Set(
        input.configs.map(config => `${config.paymentPlatformId}_${config.paymentFieldId}`)
      );

      for (const config of existingConfigs) {
        const key = `${config.paymentplatform?.id}_${config.paymentfield?.id}`;
        if (!upsertKeys.has(key)) {
          await repo.remove(config);
        }
      }

      for (const config of input.configs) {
        const existing = existingConfigs.find(
          e => e.paymentplatform?.id === config.paymentPlatformId &&
              e.paymentfield?.id === config.paymentFieldId
        );

        if (existing) {
          existing.value = config.value;
          await repo.save(existing);
        } else {
          await repo.save(
            repo.create({
              organisation: { id: input.organisationId },
              paymentplatform: { id: config.paymentPlatformId },
              paymentfield: { id: config.paymentFieldId },
              value: config.value,
            })
          );
        }
      }

      return { success: true };
    }),
});