import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahfizCenter } from "../db/entities.ts";
import { tahfizSchema } from '../schemas/tahfizSchema.ts';

export const tahfizRouter = router({
  getTahfiz: publicProcedure
  .input(z.object({
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional().nullable()
  }))
  .query(async ({ input }) => {
    const tahfizRepo = AppDataSource.getRepository(TahfizCenter);

    if (!input.coordinates) {
      return await tahfizRepo.find({
        where: {
          state: "Selangor",
        }
      })
    }

    const { latitude, longitude } = input.coordinates;

    const qb = tahfizRepo.createQueryBuilder("t")
      .where("t.latitude IS NOT NULL AND t.longitude IS NOT NULL")
      .addSelect(`
        earth_distance(
          ll_to_earth(t.latitude, t.longitude),
          ll_to_earth(:lat, :lng)
        )
      `, "distance")
      .orderBy("distance", "ASC")
      .setParameters({ lat: latitude, lng: longitude })
      .take(20);

    const { entities, raw } = await qb.getRawAndEntities();

    const results = entities.map((entity, index) => ({
      ...entity,
      distance: Number(raw[index].distance),
    }));

    return results;
  }),


  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional(),
      pageSize: z.number().min(1).optional(),
      search: z.string().optional(),
      filterState: z.string().optional(),      
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, filterState } = input;
      const repo = AppDataSource.getRepository(TahfizCenter);
      const query = repo.createQueryBuilder("tahfizcenter");

      if (search)
        query.andWhere("tahfizcenter.name ILIKE :search", { search: `%${search}%` });

      if (filterState)
        query.andWhere("tahfizcenter.state = :state", { state: filterState });

      if (page && pageSize)
        query.skip((page - 1) * pageSize).take(pageSize);

      const [items, total] = await query
        .orderBy("tahfizcenter.createdat", "DESC")
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(tahfizSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      const tahfiz = repo.create(input);
      return await repo.save(tahfiz);
    }),

  // UPDATE TAHFIZ
  update: protectedProcedure
    .input(z.object({ id: z.number(), data: tahfizSchema.partial() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      const tahfiz = await repo.findOneByOrFail({ id: input.id });
      repo.merge(tahfiz, input.data);
      return repo.save(tahfiz);
    }),

  // DELETE TAHFIZ
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      return repo.delete(input);
    }),
});
