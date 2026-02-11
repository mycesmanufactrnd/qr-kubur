import z from "zod";
import { protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharity } from "../db/entities.ts";
import { deathCharitySchema } from "../schemas/deathCharitySchema.ts";

export const deathCharityRouter = router({
    getPaginated: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterState: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { page, pageSize, filterName, filterState } = input;
  
        const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
  
        const query = deathCharityRepo.createQueryBuilder('deathcharity');
        query.leftJoinAndSelect('deathcharity.organisation', 'organisation');
  
        if (filterName) query.andWhere('deathcharity.name ILIKE :name', { name: `%${filterName}%` });
        if (filterState && filterState !== 'all') query.andWhere('deathcharity.state = :state', { state: filterState });
  
        const [items, total] = await query
          .orderBy('deathcharity.id', 'DESC')
          .skip((page - 1) * pageSize)
          .take(pageSize)
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
      deathCharityRepo.merge(deathCharity, input.data);
      return await deathCharityRepo.save(deathCharity);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
      return await deathCharityRepo.delete(input);
    }),
});