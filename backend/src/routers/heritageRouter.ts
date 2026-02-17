import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { HeritageSite } from '../db/entities/HeritageSite.entity.ts';
import { heritageSchema } from '../schemas/heritageSchema.ts';

export const heritageRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterName: z.string().optional(),
      filterState: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterState } = input;

      const heritageRepo = AppDataSource.getRepository(HeritageSite);

      const query = heritageRepo.createQueryBuilder('heritage');

      if (filterName) {
        query.andWhere('heritage.name ILIKE :name', { name: `%${filterName}%` });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere('heritage.state = :state', { state: filterState });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('heritage.id', 'DESC')
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(heritageSchema)
    .mutation(async ({ input }) => {
      const heritageRepo = AppDataSource.getRepository(HeritageSite);
      const heritage = heritageRepo.create(input);
      return await heritageRepo.save(heritage);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: heritageSchema }))
    .mutation(async ({ input }) => {
      const heritageRepo = AppDataSource.getRepository(HeritageSite);
      const heritage = await heritageRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      heritageRepo.merge(heritage, cleanedInput);
      return await heritageRepo.save(heritage);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const heritageRepo = AppDataSource.getRepository(HeritageSite);
      return await heritageRepo.delete(input);
    }),

  getHeritageByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      filters: z.record(z.string(), z.string()).optional()
    }))
    .query(async ({ input }) => {
        const heritageSiteRepo = AppDataSource.getRepository(HeritageSite);

        if (!input.coordinates) return [];

        const { latitude, longitude } = input.coordinates;

        const query = heritageSiteRepo.createQueryBuilder("heritage")
            .where("heritage.latitude IS NOT NULL AND heritage.longitude IS NOT NULL");

        if (input.filters) {
            for (const [key, value] of Object.entries(input.filters)) {
                if (value) {
                    query.andWhere(`heritage.${key} ILIKE :${key}`, { [key]: `%${value}%` });
                }
            }
        }

        query.addSelect(`
            earth_distance(
                ll_to_earth(heritage.latitude, heritage.longitude),
                ll_to_earth(:lat, :lng)
            )`, 'distance')
        .orderBy(`
            earth_distance(
            ll_to_earth(heritage.latitude, heritage.longitude),
            ll_to_earth(:lat, :lng)
            )`, 'ASC')
        .setParameters({ lat: latitude, lng: longitude });

        const { entities, raw } = await query.getRawAndEntities();

        return entities.map((entity, index) => ({
            ...entity,
            distance: Number(raw[index].distance),
        })) ?? [];
    }),

    incViewCount: publicProcedure
      .input(
        z.object({
          id: z.number()
        })
      )
      .mutation(async ({ input }) => {
        if (!input.id) return false;
  
        const repo = AppDataSource.getRepository(HeritageSite);
        const heritageSite = await repo.findOne({
          where: { id: input.id },
        });

        if (!heritageSite) return false;

        heritageSite.viewcount = (heritageSite.viewcount || 0) + 1;
        await repo.save(heritageSite);

        return { success: true, viewcount: heritageSite.viewcount };
      }),

    getHeritageById: publicProcedure
        .input(
            z.object({
              id: z.number()
            })
        )
        .query(async ({ input }) => {
          if (!input.id) {
            return null;
          }
    
          return await AppDataSource.getRepository(HeritageSite).findOne({ 
            where: { id: input.id },
          });
        }),
});
