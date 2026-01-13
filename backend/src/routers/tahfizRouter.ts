import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahfizCenter } from "../db/entities.ts";
import { tahfizSchema } from '../schemas/tahfizSchema.ts';

export const tahfizRouter = router({
  // Fetching for maps
  getTahfiz: publicProcedure
    .input(z.object({
      coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).optional().nullable()
    }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      if (!input.coordinates) {
        return repo.find({ take: 100, order: { createdat: "DESC" } });
      }
      const { latitude, longitude } = input.coordinates;
      return repo.createQueryBuilder("t")
        .where("t.latitude IS NOT NULL AND t.longitude IS NOT NULL")
        .setParameters({ lat: latitude, lng: longitude })
        .take(10)
        .getMany();
    }),

  // Fetching for Admin Table
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

      if (search) query.andWhere("tahfizcenter.name ILIKE :search", { search: `%${search}%` });
      if (filterState) query.andWhere("tahfizcenter.state = :state", { state: filterState });

      if (page && pageSize) query.skip((page - 1) * pageSize).take(pageSize);

      const [items, total] = await query.orderBy("tahfizcenter.createdat", "DESC").getManyAndCount();
      return { items, total };
    }),

  // Mutations
  create: protectedProcedure
    .input(tahfizSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      const tahfiz = repo.create(input);
      return await repo.save(tahfiz);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: tahfizSchema.partial() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      const tahfiz = await repo.findOneByOrFail({ id: input.id });
      repo.merge(tahfiz, input.data); 
      return repo.save(tahfiz);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TahfizCenter);
      return repo.delete(input);
    }),
});