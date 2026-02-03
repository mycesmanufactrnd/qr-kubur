import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Organisation } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { organisationSchema } from '../schemas/organisationSchema.ts';
import { ActiveInactiveStatus } from '../db/enums.ts';

/**
 * Recursive function to fetch all child organization IDs.
 * Used for standard admins to see their own org and all sub-orgs.
 */
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
        // 🔹 Standardized naming for organization context filtering
        organisationIds: z.array(z.number()).optional(), 
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, filterType, filterState, organisationIds } = input;
      const organisationRepo = AppDataSource.getRepository(Organisation);

      const query = organisationRepo.createQueryBuilder('organisation')
        .leftJoinAndSelect('organisation.parentorganisation', 'parent')
        .leftJoinAndSelect('organisation.organisationtype', 'type');

      // 🔹 1. Organisation Context Filtering (Supervisor Rule)
      // If organisationIds are provided (e.g., for standard Admins), restrict the view
      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('organisation.id IN (:...ids)', { ids: organisationIds });
      }

      // 🔹 2. Explicit Search Logic (Supervisor Rule: andWhere)
      if (search?.trim()) {
        query.andWhere('organisation.name ILIKE :search', {
          search: `%${search.trim()}%`,
        });
      }

      if (filterType) {
        query.andWhere(
          'organisation.organisationtypeId = :typeId',
          { typeId: filterType }
        );
      }

      if (filterState && filterState !== 'all') {
        // Correct PostgreSQL syntax for searching within an array column
        query.andWhere(
          ':state = ANY(organisation.states)',
          { state: filterState }
        );
      }

      // 🔹 3. Execution with DESC order (standard for most admin panels)
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

  /**
   * Helper procedure used by frontend to calculate accessible organization IDs
   */
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

  getAll: protectedProcedure
    .query(async () => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      return organisationRepo.find({ 
        where: { status: ActiveInactiveStatus.ACTIVE },
        order: { name: 'ASC' }
      });
    }),

  getOrganisationByCoordinates: publicProcedure
    .input(
      z.object({
        coordinates: z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
        }).optional().nullable(),
        userState: z.string().optional().nullable(),
        searchQuery: z.string().optional().nullable()
      })
    )
    .query(async ({ input }) => {
      const organisationRepo = AppDataSource.getRepository(Organisation);

      if (!input.coordinates) {
        return [];
      }

      const { latitude, longitude } = input.coordinates;

      const query = organisationRepo.createQueryBuilder("organisation")
        .where("organisation.latitude IS NOT NULL AND organisation.longitude IS NOT NULL");

      if (input.userState) {
        query.andWhere(":state = ANY(organisation.states)", {
          state: input.userState,
        });
      }

      if (input.searchQuery) {
        query.andWhere("organisation.name ILIKE :name", { name: `%${input.searchQuery}%` });
      }

      query.orderBy(`
          earth_distance(
            ll_to_earth(organisation.latitude, organisation.longitude),
            ll_to_earth(:lat, :lng)
          )
        `, 'ASC')
        .addSelect(`
          earth_distance(
            ll_to_earth(organisation.latitude, organisation.longitude),
            ll_to_earth(:lat, :lng)
          )`, 'distance')
        .setParameters({ lat: latitude, lng: longitude });

      const { entities, raw } = await query.getRawAndEntities();

      return entities.map((entity, index) => ({
        ...entity,
        distance: Number(raw[index].distance),
      }));
    }),

  getByOrganisationTypeId: protectedProcedure
  .input(
      z.object({
        organisationTypeId: z.number().optional().nullable(),
        // Note: For full standardization, use organisationIds approach if possible
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

      return await query.getMany();
    }),
});