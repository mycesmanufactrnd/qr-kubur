import { protectedProcedure, router, superAdminProcedure } from '../trpc.ts';
import { OrganisationType } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const organisationTypeRouter = router({
  getTypes: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search } = input;
      const repo = AppDataSource.getRepository(OrganisationType);
      const query = repo.createQueryBuilder('type');

      // Standardized: andWhere with ILIKE and trimming
      if (search?.trim()) {
        query.andWhere('type.name ILIKE :search', { search: `%${search.trim()}%` });
      }

      const [items, total] = await query
        .orderBy('type.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),
  
  createType: superAdminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(['active', 'inactive']).default('active'),
    }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);
      const type = repo.create(input);
      return await repo.save(type);
    }),

  updateType: superAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);

      const existing = await repo.findOneByOrFail({ id: input.id });
      
      repo.merge(existing, input);
      return await repo.save(existing);
    }),

  deleteType: superAdminProcedure
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