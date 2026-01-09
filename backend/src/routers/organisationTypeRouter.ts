import { protectedProcedure, router, superAdminProcedure } from '../trpc.ts';
import { OrganisationType } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const organisationTypeRouter = router({
  getTypes: protectedProcedure.query(async () => {
    return AppDataSource
      .getRepository(OrganisationType)
      .find();
  }),
  
  createType: superAdminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(['active', 'inactive']).default('active'),
      })
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);

      const type = repo.create(input);
      return await repo.save(type);
    }),

  updateType: superAdminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(OrganisationType);

      const existing = await repo.findOne({ where: { id: input.id } });
      if (!existing) {
        throw new Error(`OrganisationType ${input.id} not found`);
      }

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
