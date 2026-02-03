import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { ActivityPost } from '../db/entities.ts';
import { activityPostSchema } from '../schemas/activityPostSchema.ts';

export const activityPostRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterTitle: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterTitle } = input;

      const activityPostRepo = AppDataSource.getRepository(ActivityPost);

      const query = activityPostRepo.createQueryBuilder('posts');

      if (filterTitle) query.andWhere('posts.title ILIKE :title', { title: `%${filterTitle}%` });

      const [items, total] = await query
        .orderBy('posts.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(activityPostSchema)
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);

      const activityPost = activityPostRepo.create(input);

      return await activityPostRepo.save(activityPost);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: activityPostSchema }))
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);

      const activityPost = await activityPostRepo.findOneByOrFail({ id: input.id });

      activityPostRepo.merge(activityPost, input.data);

      return await activityPostRepo.save(activityPost);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      return await activityPostRepo.delete(input);
    }),
});