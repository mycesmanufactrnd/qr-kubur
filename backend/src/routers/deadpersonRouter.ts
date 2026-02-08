import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { DeadPerson } from '../db/entities.ts';
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
      organisationIds: z.array(z.number()).optional(),
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

      const query = repo.createQueryBuilder('deadperson')
        .leftJoinAndSelect('deadperson.grave', 'grave');

      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('grave.organisationId IN (:...ids)', { ids: organisationIds });
      }

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

      if (dateFrom && dateTo) {
        query.andWhere('deadperson.dateofdeath BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
      } else if (dateFrom) {
        query.andWhere('deadperson.dateofdeath >= :dateFrom', { dateFrom });
      } else if (dateTo) {
        query.andWhere('deadperson.dateofdeath <= :dateTo', { dateTo });
      }

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

      const person = repo.create(input);

      return await repo.save(person);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deadPersonSchema }))
    .mutation(async ({ input }) => {
      const deadPersonRepo = AppDataSource.getRepository(DeadPerson);
      const person = await deadPersonRepo.findOneByOrFail({ id: input.id });

      deadPersonRepo.merge(person, input.data);
      
      return await deadPersonRepo.save(person);
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