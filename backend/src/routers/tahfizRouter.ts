import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { ActivityPost, TahfizCenter } from "../db/entities.ts";
import { tahfizSchema } from '../schemas/tahfizSchema.ts';

export const tahfizRouter = router({
  getTahfizById: publicProcedure
    .input(
        z.object({
          id: z.number(),
        })
    )
    .query(async ({ input }) => {
      if (!input.id) {
        return null;
      }

      return await AppDataSource.getRepository(TahfizCenter).findOne({ 
        where: { id: input.id },
      });
    }),

  getTahfizPosts: publicProcedure
    .input(
        z.object({
          id: z.number(),
        })
    )
    .query(async ({ input }) => {
      if (!input.id) {
        return null;
      }

      return await AppDataSource.getRepository(ActivityPost).find({
        where: { tahfizcenter: { id: input.id } },
        order: { createdat: "DESC" },
        take: 5,
      });
    }),

  getTahfizByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      userState: z.string().optional().nullable(),
      searchQuery: z.string().optional().nullable()
    }))
    .query(async ({ input }) => {
      const tahfizRepo = AppDataSource.getRepository(TahfizCenter);

      if (!input.coordinates) {
        return [];
      }

      const { latitude, longitude } = input.coordinates;

      const query = tahfizRepo.createQueryBuilder("tahfiz")
        .where("tahfiz.latitude IS NOT NULL AND tahfiz.longitude IS NOT NULL")
        .andWhere("tahfiz.state = :state", { state: input.userState });

      if (input.searchQuery) {
        query.andWhere("tahfiz.name ILIKE :name", { name: `%${input.searchQuery}%` });
      }

      query.orderBy(`
          earth_distance(
            ll_to_earth(tahfiz.latitude, tahfiz.longitude),
            ll_to_earth(:lat, :lng)
          )
        `, 'ASC')
      .addSelect(`
        earth_distance(
          ll_to_earth(tahfiz.latitude, tahfiz.longitude),
          ll_to_earth(:lat, :lng)
        )`, 'distance')
      .setParameters({ lat: latitude, lng: longitude });

    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      distance: Number(raw[index].distance),
    }));
  }),

  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional(),
      pageSize: z.number().min(1).optional(),
      search: z.string().optional(),
      filterState: z.string().optional(),
      currentUserTahfiz: z.number().optional().nullable(),
      checkRole: z.object({
        superadmin: z.boolean(),
        tahfiz: z.boolean(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, filterState, currentUserTahfiz, checkRole } = input;

      const tahfizRepo = AppDataSource.getRepository(TahfizCenter);
      const query = tahfizRepo.createQueryBuilder("tahfizcenter");

      if (search) {
        query.andWhere("tahfizcenter.name ILIKE :search", { search: `%${search}%` });
      }

      if (filterState) {
        query.andWhere("tahfizcenter.state = :state", { state: filterState });
      }

      if (checkRole?.tahfiz && currentUserTahfiz) {
        query.andWhere("tahfizcenter.id = :id", {
          id: currentUserTahfiz,
        });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

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