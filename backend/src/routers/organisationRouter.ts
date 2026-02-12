import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Organisation } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { organisationSchema } from '../schemas/organisationSchema.ts';
import { ActiveInactiveStatus } from '../db/enums.ts';

async function getOrganisationTreeIds(rootId: number) {
  const result = await AppDataSource.query(`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organisation WHERE id = $1
      UNION ALL
      SELECT o.id
      FROM organisation o
      JOIN org_tree ot ON o."parentorganisationId" = ot.id
    )
    SELECT id FROM org_tree;
  `, [rootId]);

  return result.map((r: any) => r.id);
}

export const organisationRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        search: z.string().optional(),
        filterType: z.number().optional(),
        filterState: z.string().optional(),
        organisationIds: z.array(z.number()).optional(), 
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, search, filterType, filterState } = input;
      const { user } = ctx;
      const organisationRepo = AppDataSource.getRepository(Organisation);

      const query = organisationRepo.createQueryBuilder('organisation')
        .leftJoinAndSelect('organisation.parentorganisation', 'parent')
        .leftJoinAndSelect('organisation.organisationtype', 'type');

      if (user.role !== 'superadmin') {
        query.andWhere(
          '(organisation.id = :userOrgId OR organisation."parentorganisationId" = :userOrgId)',
          { userOrgId: user.organisationId }
        );
      }

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
      const organisationRepo = AppDataSource.getRepository(Organisation);
      const organisation = organisationRepo.create(input);
      return await organisationRepo.save(organisation);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: organisationSchema }))
    .mutation(async ({ input }) => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      const organisation = await organisationRepo.findOneByOrFail({ id: input.id });
      organisationRepo.merge(organisation, input.data);
      return organisationRepo.save(organisation);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      return organisationRepo.delete(input);
    }),

  getAll: protectedProcedure
    .query(async () => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      return organisationRepo.find({ 
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

    getParentAndChildOrgs: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      isIdOnly: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const { organisationId, isIdOnly = true } = input;

      const orgs = await AppDataSource.getRepository(Organisation)
        .createQueryBuilder('org')
        .where('org.id = :id OR org."parentorganisationId" = :id', { id: organisationId })
        .getMany();

      return isIdOnly ? orgs.map(o => o.id) : orgs;
    }),

    getByOrganisationTypeId: protectedProcedure
    .input(
        z.object({
          organisationTypeId: z.number().optional().nullable(),
          organisationIds: z.array(z.number()).optional(), 
        })
      )
      .query(async ({ input }) => {
        const { organisationTypeId, organisationIds } = input;
        const organisationRepo = AppDataSource.getRepository(Organisation);

        const query = organisationRepo.createQueryBuilder('organisation')
          .where('organisation.status = :active', { active: ActiveInactiveStatus.ACTIVE });

        if (organisationIds && organisationIds.length > 0) {
          query.andWhere('organisation.id IN (:...ids)', { ids: organisationIds });
        }

        if (organisationTypeId) {
          query.andWhere('organisation.organisationtypeId = :id', {
            id: organisationTypeId,
          });
        }
      }),
});