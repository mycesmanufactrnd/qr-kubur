// @ts-nocheck
import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { DeathCharity } from "../db/entities.js";
import { deathCharitySchema } from "../schemas/deathCharitySchema.js";

export const deathCharityRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterName: z.string().optional(),
      filterState: z.string().optional(),
      organisationId: z.number().optional().nullable(),
      isSuperAdmin: z.boolean().default(false),
      sortField: z.string().optional(),
      sortOrder: z.enum(["ASC", "DESC"]).optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterState, organisationId, isSuperAdmin, sortField, sortOrder } = input;

      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);

      const query = deathCharityRepo.createQueryBuilder('deathcharity');
        query.leftJoinAndSelect('deathcharity.organisation', 'organisation');

      if (!isSuperAdmin) {
        if (!organisationId) {
          return { items: [], total: 0 };
        }

        query.andWhere("organisation.id = :organisationId", {
          organisationId,
        });
      }

      if (filterName) {
        query.andWhere('deathcharity.name ILIKE :name', { name: `%${filterName}%` });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere('deathcharity.state = :state', { state: filterState });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const allowedSortFields: Record<string, string> = {
        name: 'deathcharity.name',
        state: 'deathcharity.state',
      };
      const orderCol = (sortField && allowedSortFields[sortField]) || 'deathcharity.id';
      const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
      .input(deathCharitySchema)
      .mutation(async ({ input }) => {
        const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
        const deathCharity = deathCharityRepo.create(input);
        return await deathCharityRepo.save(deathCharity);
      }),
  
  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deathCharitySchema }))
    .mutation(async ({ input }) => {
      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
      const deathCharity = await deathCharityRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      deathCharityRepo.merge(deathCharity, cleanedInput);
      return await deathCharityRepo.save(deathCharity);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
      return await deathCharityRepo.delete(input);
    }),

  getDeathCharityByOrganisation: protectedProcedure
    .input(z.object({
        organisationId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }))
    .query(async ({ input }) => {
      const { organisationId, isSuperAdmin } = input;

      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);

      if (isSuperAdmin) {
        return await deathCharityRepo.find({
          select: {
            id: true,
            name: true,
          }
        });
      }

      return await deathCharityRepo.find({
        where: { 
          organisation: { 
            id: organisationId 
          } 
        },
        select: {
          id: true,
          name: true,
        }
      });
    }),

  getDeathCharityByMosqueId: publicProcedure
    .input(z.object({
      mosqueId: z.number(),
    }))
    .query(async ({ input }) => {
      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);

      return await deathCharityRepo
        .createQueryBuilder("deathcharity")
        .where("deathcharity.mosqueid = :mosqueId", { mosqueId: input.mosqueId })
        .andWhere("deathcharity.isactive = :isactive", { isactive: true })
        .orderBy("deathcharity.id", "DESC")
        .getOne();
    }),
});
