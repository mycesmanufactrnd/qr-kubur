import { router, superAdminProcedure } from '../trpc.ts';
import { Organisation, OrganisationType } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';

export const organisationRouter = router({
    getTypes: superAdminProcedure.query(async () => {
        return AppDataSource
        .getRepository(Organisation)
        .find();
    }),

    getPaginated: superAdminProcedure
    .input(
      z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1),
        search: z.string().optional(),
        filterType: z.string().optional(),
        filterState: z.string().optional(),
        isSuperAdmin: z.boolean().optional(),
        isAdmin: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, filterType, filterState } = input;
      const repo = AppDataSource.getRepository(Organisation);

      const query = repo.createQueryBuilder('org');

      // Join organisation type if needed
      query.leftJoinAndSelect('org.organisationtype', 'type');

      // Search filter
      if (search) {
        query.andWhere('org.name ILIKE :search', { search: `%${search}%` });
      }

      // Type filter
      if (filterType && filterType !== 'all') {
        query.andWhere('org.organisation_type_id = :typeId', { typeId: filterType });
      }

      // State filter
      if (filterState && filterState !== 'all') {
        query.andWhere(':state = ANY(org.states)', { state: filterState });
      }

      // Pagination
      const [items, total] = await query
        .orderBy('org.createdat', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),
});