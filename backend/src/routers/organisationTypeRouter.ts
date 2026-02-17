import { protectedProcedure, router, superAdminProcedure } from '../trpc.ts';
import { OrganisationType } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const organisationTypeRouter = router({
  getTypes: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterName } = input;
      const repo = AppDataSource.getRepository(OrganisationType);
      const query = repo.createQueryBuilder('type');

      if (filterName?.trim()) {
        query.andWhere('type.name ILIKE :name', { name: `%${filterName.trim()}%` });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('type.id', 'DESC')
        .getManyAndCount();

      return { items, total };
    }),
  
  create: superAdminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(ActiveInactiveStatus).default(ActiveInactiveStatus.ACTIVE),
    }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);
      const type = repo.create(input);
      return await repo.save(type);
    }),

  update: superAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(ActiveInactiveStatus).optional(),
    }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);

      const existing = await repo.findOneByOrFail({ id: input.id });
      
      repo.merge(existing, input);
      return await repo.save(existing);
    }),

  delete: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);

      const result = await repo.delete(input.id);
      if (result.affected === 0) {
        throw new Error(`OrganisationType ${input.id} not found`);
      }

      return { success: true };
    }),
});