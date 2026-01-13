import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Grave } from '../db/entities.ts';
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

      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('organisation.id IN (:...ids)', { ids: organisationIds });
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

  getGraveById: publicProcedure
    .input(
        z.object({
          id: z.number()
        })
    )
    .query(async ({ input }) => {
      if (!input.id) {
        return null;
      }

      return await AppDataSource.getRepository(Grave).findOne({ 
        where: { id: input.id } 
      });
    }),

  getGraveByCoordinates: publicProcedure
    .input(
        z.object({
        coordinates: z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
        }).optional().nullable()
        })
    )
    .query(async ({ input }) => {
        const graveRepo = AppDataSource.getRepository(Grave);

        if (!input.coordinates) {
          return [];
        }

        const { latitude, longitude } = input.coordinates;

        return graveRepo.createQueryBuilder("grave")
        .where("grave.latitude IS NOT NULL AND grave.longitude IS NOT NULL")
        .orderBy(
            `
            earth_distance(
                ll_to_earth(grave.latitude, grave.longitude),
                ll_to_earth(:lat, :lng)
            )
            `,
            "ASC"
        )
        .setParameters({ lat: latitude, lng: longitude })
        .getMany();
    }),

  bulkCreate: protectedProcedure
    .input(z.array(graveSchema))
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      
      const results = await graveRepo.save(input);
      return { count: results.length };
    }),
});