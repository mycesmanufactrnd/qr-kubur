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
      organisationIds: z.array(z.number()).optional(), // 🔹 Standardized naming
    }))
    .query(async ({ input }) => {
      const { 
        page, 
        pageSize, 
        search, 
        filterIC, 
        filterGrave, 
        filterState, 
        dateFrom, 
        dateTo, 
        organisationIds 
      } = input;
      
      const repo = AppDataSource.getRepository(DeadPerson);

      // Start Query Builder with required join for state and organisation filtering
      const query = repo.createQueryBuilder('deadperson')
        .leftJoinAndSelect('deadperson.grave', 'grave');

      // 🔹 1. Organisation/Context Filtering (Supervisor Rule)
      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('grave.organisationId IN (:...ids)', { ids: organisationIds });
      }

      // 🔹 2. Explicit Search Logic (andWhere)
      if (search?.trim()) {
        query.andWhere('deadperson.name ILIKE :search', { search: `%${search.trim()}%` });
      }

      if (filterIC?.trim()) {
        query.andWhere('deadperson.icnumber ILIKE :ic', { ic: `%${filterIC.trim()}%` });
      }

      if (filterGrave) {
        query.andWhere('deadperson.graveId = :graveId', { graveId: filterGrave });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere('grave.state = :state', { state: filterState });
      }

      // 🔹 3. Date Range Filtering
      if (dateFrom && dateTo) {
        query.andWhere('deadperson.dateofdeath BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
      } else if (dateFrom) {
        query.andWhere('deadperson.dateofdeath >= :dateFrom', { dateFrom });
      } else if (dateTo) {
        query.andWhere('deadperson.dateofdeath <= :dateTo', { dateTo });
      }

      // 🔹 4. Pagination and Execution
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
      
      // Ensure the target Grave exists
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: graveId });

      const person = repo.create({ 
        ...personData, 
        grave 
      });

      return await repo.save(person);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deadPersonSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeadPerson);
      
      // Ensure the deceased record exists
      const person = await repo.findOneByOrFail({ id: input.id });
      
      const { graveId, ...personData } = input.data;

      // Ensure the updated target Grave exists
      const grave = await AppDataSource.getRepository(Grave).findOneByOrFail({ id: graveId });

      // Standardized Merge and Save
      repo.merge(person, { 
        ...personData, 
        grave 
      });

      return await repo.save(person);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeadPerson);
      return await repo.delete(input);
    }),

  getDeadPersonById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;

      return await AppDataSource.getRepository(DeadPerson).findOne({ 
        where: { id: input.id },
        relations: ['grave', 'grave.organisation']
      });
    }),

  getDeadPersonByGraveId: publicProcedure
    .input(z.object({ graveId: z.number() }))
    .query(async ({ input }) => {
      if (!input.graveId) return null;

      return await AppDataSource.getRepository(DeadPerson).find({ 
        where: { grave: { id: input.graveId } },
        relations: ['grave']
      });
    }),
});