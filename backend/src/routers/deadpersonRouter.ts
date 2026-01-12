// routers/deadPersonRouter.ts
import { protectedProcedure, router } from '../trpc.ts';
import { DeadPerson, Grave } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { deadPersonSchema } from '../schemas/deadPersonSchema.ts';

export const deadPersonRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
      filterIC: z.string().optional(),
      filterGrave: z.number().optional(),
      filterState: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      accessibleGravesIds: z.array(z.number()).optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, filterIC, filterGrave, filterState, dateFrom, dateTo, accessibleGravesIds } = input;
      const repo = AppDataSource.getRepository(DeadPerson);

      const query = repo.createQueryBuilder('deadperson')
        .leftJoinAndSelect('deadperson.grave', 'grave');

      if (accessibleGravesIds && accessibleGravesIds.length > 0) {
        query.andWhere('deadperson.graveId IN (:...ids)', { ids: accessibleGravesIds });
      }

      if (search) query.andWhere('deadperson.name ILIKE :search', { search: `%${search}%` });
      if (filterIC) query.andWhere('deadperson.icnumber ILIKE :ic', { ic: `%${filterIC}%` });
      if (filterGrave) query.andWhere('deadperson.graveId = :graveId', { graveId: filterGrave });
      if (filterState) query.andWhere('grave.state = :state', { state: filterState });

      if (dateFrom) query.andWhere('deadperson.dateofdeath >= :dateFrom', { dateFrom });
      if (dateTo) query.andWhere('deadperson.dateofdeath <= :dateTo', { dateTo });

      const [items, total] = await query
        .orderBy('deadperson.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(deadPersonSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeadPerson);
      // Logic to link grave
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: input.graveId });
      const person = repo.create({ ...input, grave });
      return await repo.save(person);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deadPersonSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeadPerson);
      const person = await repo.findOneByOrFail({ id: input.id });
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: input.data.graveId });
      repo.merge(person, { ...input.data, grave });
      return await repo.save(person);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await AppDataSource.getRepository(DeadPerson).delete(input);
    }),
});