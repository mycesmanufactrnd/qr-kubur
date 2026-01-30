import { publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { HeritageSite } from '../db/entities/HeritageSite.entity.ts';

export const heritageRouter = router({
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
