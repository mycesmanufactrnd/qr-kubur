import z from "zod";
import { AppDataSource } from "../datasource.ts";
import { PaymentPlatform } from "../db/entities/PaymentPlatform.entity.ts";
import { protectedProcedure, router, superAdminProcedure } from "../trpc.ts";
import { paymentPlatformSchema } from "../schemas/paymentPlatformSchema.ts";
import { ActiveInactiveStatus } from "../db/enums.ts";

export const paymentPlatformRouter = router({
  getPaginated: superAdminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search } = input;
      const repo = AppDataSource.getRepository(PaymentPlatform);
      const query = repo.createQueryBuilder('platform');

      if (search?.trim()) {
        query.andWhere('platform.name ILIKE :search OR platform.code ILIKE :search', { 
          search: `%${search.trim()}%` 
        });
      }

      const [items, total] = await query
        .orderBy('platform.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  getActivePlatform: protectedProcedure
    .query(() => {
      return AppDataSource.getRepository(PaymentPlatform).find({
        where: { status: ActiveInactiveStatus.ACTIVE },
        relations: ['paymentfields']
      });
    }),

  create: superAdminProcedure
    .input(paymentPlatformSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentPlatform);
      return await repo.save(repo.create(input));
    }),
  
  update: superAdminProcedure
    .input(z.object({ id: z.number(), data: paymentPlatformSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentPlatform);
      const platform = await repo.findOneByOrFail({ id: input.id });
      repo.merge(platform, input.data);
      return await repo.save(platform);
    }),

  delete: superAdminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentPlatform);
      return await repo.delete(input);
    }),
});