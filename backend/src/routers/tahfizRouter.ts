import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { ActivityPost, TahfizCenter } from "../db/entities.ts";
import { tahfizSchema } from '../schemas/tahfizSchema.ts';

export const tahfizRouter = router({
  // 🔹 Standardized getPaginated (Matches the logic in Graves & Organizations)
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      search: z.string().optional(),
      filterState: z.string().optional(),
      // 🔹 Standardized naming for organization/scope restriction
      organisationIds: z.array(z.number()).optional(), 
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, filterState, organisationIds } = input;
      const tahfizRepo = AppDataSource.getRepository(TahfizCenter);
      const query = tahfizRepo.createQueryBuilder("tahfiz");

      // 🔹 1. Context/Role Filtering (Supervisor Rule)
      // Restricts Tahfiz Admins to only see centers they are authorized for
      if (organisationIds && organisationIds.length > 0) {
        query.andWhere("tahfiz.id IN (:...ids)", { ids: organisationIds });
      }

      // 🔹 2. Explicit Search Logic (andWhere + ILIKE)
      if (search?.trim()) {
        query.andWhere("tahfiz.name ILIKE :search", { search: `%${search.trim()}%` });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere("tahfiz.state = :state", { state: filterState });
      }

      // 🔹 3. Pagination & Execution (Applied consistently)
      const [items, total] = await query
        .orderBy("tahfiz.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  getTahfizById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;
      return await AppDataSource.getRepository(TahfizCenter).findOne({ 
        where: { id: input.id },
      });
    }),

  getTahfizPosts: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;
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
      if (!input.coordinates) return [];

      const { latitude, longitude } = input.coordinates;
      const query = tahfizRepo.createQueryBuilder("tahfiz")
        .where("tahfiz.latitude IS NOT NULL AND tahfiz.longitude IS NOT NULL");

      if (input.userState) {
        query.andWhere("tahfiz.state = :state", { state: input.userState });
      }

      if (input.searchQuery) {
        query.andWhere("tahfiz.name ILIKE :name", { name: `%${input.searchQuery}%` });
      }

      query.addSelect(`
          earth_distance(
            ll_to_earth(tahfiz.latitude, tahfiz.longitude),
            ll_to_earth(:lat, :lng)
          )`, 'distance')
        .orderBy("distance", 'ASC')
        .setParameters({ lat: latitude, lng: longitude });

      const { entities, raw } = await query.getRawAndEntities();

      return entities.map((entity, index) => ({
        ...entity,
        distance: Number(raw[index].distance),
      }));
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