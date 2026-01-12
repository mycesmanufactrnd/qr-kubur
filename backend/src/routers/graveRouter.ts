import { protectedProcedure, router } from '../trpc.ts';
import { Grave, Organisation } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { graveSchema } from '../schemas/graveSchema.ts';

export const graveRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
      filterState: z.string().optional(),
      filterStatus: z.string().optional(),
      filterBlock: z.string().optional(),
      filterLot: z.string().optional(),
      organisationIds: z.array(z.number()).optional(), // For access control
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, filterState, filterStatus, filterBlock, filterLot, organisationIds } = input;
      const graveRepo = AppDataSource.getRepository(Grave);

      const query = graveRepo.createQueryBuilder('grave')
        .leftJoinAndSelect('grave.organisation', 'organisation');

      // Access Control
      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('grave.organisationid IN (:...ids)', { ids: organisationIds });
      }

      if (search) {
        query.andWhere('grave.name ILIKE :search', { search: `%${search}%` });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere('grave.state = :state', { state: filterState });
      }
  
      if (filterBlock) {
          query.andWhere('grave.block ILIKE :block', { block: `%${filterBlock}%` });
      }

      if (filterLot) {
          query.andWhere('grave.lot ILIKE :lot', { lot: `%${filterLot}%` });
      }

      if (filterStatus && filterStatus !== 'all') {
        query.andWhere('grave.status = :status', { status: filterStatus });
      }

      const [items, total] = await query
        .orderBy('grave.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(graveSchema)
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      const grave = graveRepo.create(input);
      return await graveRepo.save(grave);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: graveSchema }))
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      const grave = await graveRepo.findOneByOrFail({ id: input.id });
      graveRepo.merge(grave, input.data);
      return await graveRepo.save(grave);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      return await graveRepo.delete(input);
    }),
});