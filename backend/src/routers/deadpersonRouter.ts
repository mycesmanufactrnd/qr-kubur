import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { DeadPerson, Grave } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { deadPersonSchema } from '../schemas/deadpersonSchema.ts';

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

      // Filter by authorized grave IDs
      if (accessibleGravesIds && accessibleGravesIds.length > 0) {
        query.andWhere('deadperson.graveId IN (:...ids)', { ids: accessibleGravesIds });
      }

      // Search and Filter logic
      if (search) query.andWhere('deadperson.name ILIKE :search', { search: `%${search}%` });
      if (filterIC) query.andWhere('deadperson.icnumber ILIKE :ic', { ic: `%${filterIC}%` });
      if (filterGrave) query.andWhere('deadperson.graveId = :graveId', { graveId: filterGrave });
      if (filterState) query.andWhere('grave.state = :state', { state: filterState });

      if (dateFrom && dateTo) { query.andWhere( 'deadperson.dateofdeath BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo } ); } else if (dateFrom) { query.andWhere( 'deadperson.dateofdeath = :dateFrom', { dateFrom } ); } else if (dateTo) { query.andWhere( 'deadperson.dateofdeath = :dateTo', { dateTo } ); }

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
      const { graveId, ...personData } = input;
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: graveId });

      // Create person with explicit grave relation
      const person = repo.create({ ...personData, grave });

      return await repo.save(person);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deadPersonSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeadPerson);
      
      // Ensure record exists
      const person = await repo.findOneByOrFail({ id: input.id });
      
      const { graveId, ...personData } = input.data;

      // Ensure the target Grave exists
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: graveId });

      // Merge updated data and re-link the grave relation
      repo.merge(person, { 
        ...personData, 
        grave 
      });

      return await repo.save(person);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      // Direct deletion by ID
      return await AppDataSource.getRepository(DeadPerson).delete(input);
    }),

getById: protectedProcedure
  .input(z.number())
  .query(async ({ input }) => {
    const repo = AppDataSource.getRepository(DeadPerson);
    // We use relations: ['grave'] so that the grave data 
    // comes back in the same request!
    return await repo.findOne({ 
      where: { id: input },
      relations: ['grave'] 
    });
  }),
});