import { protectedProcedure, router } from '../trpc.ts';
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
      INNER JOIN org_tree ot ON ot.id = o.parentorganisationId
    )
    SELECT id FROM org_tree
  `, [rootId]);

  return result.map((r: any) => r.id);
}

export const organisationRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().optional().nullable(),
        pageSize: z.number().optional().nullable(),
        search: z.string().optional(),
        filterType: z.number().optional(),
        filterState: z.string().optional(),
        currentUserOrganisation: z.number().optional(),
        checkRole: z.object({
          superadmin: z.boolean(),
          admin: z.boolean(),
          employee: z.boolean(),
          tahfiz: z.boolean(),
        }).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, filterType, filterState, checkRole, currentUserOrganisation } = input;
      const organisationRepo = AppDataSource.getRepository(Organisation);

      const query = organisationRepo.createQueryBuilder('organisation')
        .leftJoinAndSelect('organisation.parentorganisation', 'parent')
        .leftJoinAndSelect('organisation.organisationtype', 'type');

      if (checkRole?.superadmin) {}
      else if (checkRole?.admin && currentUserOrganisation) {
        const allowedIds = await getOrganisationTreeIds(currentUserOrganisation);
        query.andWhere('organisation.id IN (:...allowedIds)', { allowedIds });
      }
      else if (checkRole?.employee && currentUserOrganisation) {
        query.andWhere('organisation.id = :orgId', { orgId: currentUserOrganisation });
      }

      if (search) {
        query.andWhere('organisation.name ILIKE :search', {
          search: `%${search}%`,
        });
      }

      if (typeof filterType === 'number') {
        query.andWhere(
          'organisation.organisationtypeId = :typeId',
          { typeId: filterType }
        );
      }

      if (filterState) {
        query.andWhere(
          ':state = ANY(organisation.states)',
          { state: filterState }
        );
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const [items, total] = await query
        .orderBy('organisation.createdat', 'DESC')
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

  getParentAndChildOrgs: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      isIdOnly: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const { organisationId, isIdOnly = true } = input;

      const orgs = await AppDataSource.getRepository(Organisation)
        .createQueryBuilder('org')
        .where('org.id = :id OR org.parentorganisation = :id', { id: organisationId })
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


});