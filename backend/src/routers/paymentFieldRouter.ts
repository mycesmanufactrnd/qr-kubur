import z from "zod";
import { AppDataSource } from "../datasource.ts";
import { PaymentField } from "../db/entities.ts";
import { paymentFieldSchema } from "../schemas/paymentFieldSchema.ts";
import { router, superAdminProcedure } from "../trpc.ts";

export const paymentFieldRouter = router({
  getPaginated: superAdminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
      platformId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, platformId } = input;
      const repo = AppDataSource.getRepository(PaymentField);
      const query = repo.createQueryBuilder('field')
        .leftJoinAndSelect('field.paymentplatform', 'platform');

      if (search?.trim()) {
        query.andWhere('(field.label ILIKE :search OR field.key ILIKE :search)', { 
          search: `%${search.trim()}%` 
        });
      }

      if (platformId) {
        query.andWhere('platform.id = :platformId', { platformId });
      }

      const [items, total] = await query
        .orderBy('field.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
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