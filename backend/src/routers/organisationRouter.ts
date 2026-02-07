import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Organisation } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { organisationSchema } from '../schemas/organisationSchema.ts';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const organisationRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        search: z.string().optional(),
        filterType: z.number().optional(),
        filterState: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, search, filterType, filterState } = input;
      const { user } = ctx; // 🔹 Extract user from context for secure filtering
      const repo = AppDataSource.getRepository(Organisation);

      const query = repo.createQueryBuilder('organisation')
        .leftJoinAndSelect('organisation.parentorganisation', 'parent')
        .leftJoinAndSelect('organisation.organisationtype', 'type');

      // 🔹 1. Role-Based Data Isolation (Supervisor Standard)
      if (user.role !== 'superadmin') {
        // Standard admins only see their own organization or its descendants
        query.andWhere(
          '(organisation.id = :userOrgId OR organisation."parentorganisationId" = :userOrgId)',
          { userOrgId: user.organisationId }
        );
      }

      // 🔹 2. Explicit Search Logic (ILIKE)
      if (search?.trim()) {
        query.andWhere('organisation.name ILIKE :search', {
          search: `%${search.trim()}%`,
        });
      }

      if (filterType) {
        query.andWhere('organisation.organisationtypeId = :typeId', { typeId: filterType });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere(':state = ANY(organisation.states)', { state: filterState });
      }

      const [items, total] = await query
        .orderBy('organisation.createdat', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(organisationSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      return await repo.save(repo.create(input));
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: organisationSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      const organisation = await repo.findOneByOrFail({ id: input.id });
      repo.merge(organisation, input.data);
      return await repo.save(organisation);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await AppDataSource.getRepository(Organisation).delete(input);
    }),

  getAll: protectedProcedure
    .query(async () => {
      return await AppDataSource.getRepository(Organisation).find({ 
        where: { status: ActiveInactiveStatus.ACTIVE },
        order: { name: 'ASC' }
      });
    }),

  getOrganisationByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      userState: z.string().optional().nullable(),
      searchQuery: z.string().optional().nullable()
    }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      if (!input.coordinates) return [];

      const { latitude, longitude } = input.coordinates;
      const query = repo.createQueryBuilder("organisation")
        .where("organisation.latitude IS NOT NULL AND organisation.longitude IS NOT NULL");

      if (input.userState) query.andWhere(":state = ANY(organisation.states)", { state: input.userState });
      if (input.searchQuery) query.andWhere("organisation.name ILIKE :name", { name: `%${input.searchQuery}%` });

      query.orderBy(`earth_distance(ll_to_earth(organisation.latitude, organisation.longitude), ll_to_earth(:lat, :lng))`, 'ASC')
        .setParameters({ lat: latitude, lng: longitude });

      return await query.getMany();
    }),
});