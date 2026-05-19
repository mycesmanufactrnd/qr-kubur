// @ts-nocheck
import z from "zod";
import { AppDataSource } from "../datasource.js";
import { PaymentField } from "../db/entities.js";
import { paymentFieldSchema } from "../schemas/paymentFieldSchema.js";
import { router, superAdminProcedure } from "../trpc.js";

export const paymentFieldRouter = router({
  getPaginated: superAdminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterLabelKey: z.string().optional(),
      platformId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterLabelKey, platformId } = input;
      const repo = AppDataSource.getRepository(PaymentField);
      const query = repo.createQueryBuilder('field')
        .leftJoinAndSelect('field.paymentplatform', 'platform');

      if (filterLabelKey?.trim()) {
        query.andWhere('(field.label ILIKE :labelkey OR field.key ILIKE :labelkey)', { 
          labelkey: `%${filterLabelKey.trim()}%` 
        });
      }

      if (platformId) {
        query.andWhere('platform.id = :platformId', { platformId });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('field.id', 'DESC')
        .getManyAndCount();

      return { items, total };
    }),

  create: superAdminProcedure
    .input(paymentFieldSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentField);
      return await repo.save(repo.create(input));
    }),
  
  update: superAdminProcedure
    .input(z.object({ id: z.number(), data: paymentFieldSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentField);
      const field = await repo.findOneByOrFail({ id: input.id });
      repo.merge(field, input.data);
      return await repo.save(field);
    }),

  delete: superAdminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentField);
      return await repo.delete(input);
    }),
});