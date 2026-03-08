import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc.ts';
import { TahfizPaymentConfig, User } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

const ensureTahfizConfigAccess = async ({
  currentUserId,
  currentUserRole,
  targetTahfizId,
}: {
  currentUserId: number;
  currentUserRole?: string;
  targetTahfizId: number;
}) => {
  if (currentUserRole === 'superadmin') {
    return;
  }

  const userRepo = AppDataSource.getRepository(User);
  const currentUser = await userRepo.findOne({
    where: { id: currentUserId },
    relations: ['tahfizcenter'],
  });

  if (!currentUser?.tahfizcenter?.id || currentUser.tahfizcenter.id !== targetTahfizId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not allowed to access this tahfiz payment config',
    });
  }
};

export const tahfizPaymentConfigRouter = router({
  getConfigByTahfizId: protectedProcedure
    .input(
      z.object({
        tahfiz: z.object({ id: z.number() }).nullable().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.tahfiz?.id) {
        return [];
      }

      await ensureTahfizConfigAccess({
        currentUserId: Number(ctx.user.id),
        currentUserRole: ctx.user.role,
        targetTahfizId: input.tahfiz.id,
      });

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
    .mutation(async ({ input, ctx }) => {
      await ensureTahfizConfigAccess({
        currentUserId: Number(ctx.user.id),
        currentUserRole: ctx.user.role,
        targetTahfizId: input.tahfizId,
      });

      const repo = AppDataSource.getRepository(TahfizPaymentConfig);

      const existingConfigs = await repo.find({
        where: { tahfizcenter: { id: input.tahfizId } },
        relations: ['tahfizcenter', 'paymentplatform', 'paymentfield'],
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
              tahfizcenter: { id: input.tahfizId },
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
