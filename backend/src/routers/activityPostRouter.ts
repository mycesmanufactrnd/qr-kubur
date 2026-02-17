import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { ActivityPost } from '../db/entities.ts';
import { activityPostSchema } from '../schemas/activityPostSchema.ts';
import type { DeepPartial } from 'typeorm';

export const activityPostRouter = router({
  getPaginated: publicProcedure 
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterTitle: z.string().optional(),
      mosqueId: z.number().optional().nullable(),
      tahfizId: z.number().optional().nullable(),
      isSuperAdmin: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterTitle, mosqueId, tahfizId, isSuperAdmin } = input;

      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      const query = activityPostRepo.createQueryBuilder('posts')
        .leftJoinAndSelect('posts.mosque', 'mosque')
        .leftJoinAndSelect('posts.tahfiz', 'tahfiz');

      if (!isSuperAdmin) {
        if (mosqueId) {
          query.andWhere('posts.mosqueId = :mId', { mId: mosqueId });
        } else if (tahfizId) {
          query.andWhere('posts.tahfizId = :tId', { tId: tahfizId });
        }
      }

      if (filterTitle) {
        query.andWhere('posts.title ILIKE :title', { title: `%${filterTitle}%` });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('posts.id', 'DESC')
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(activityPostSchema)
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);

      const cleanedInput: DeepPartial<ActivityPost> = {
        ...input,
        photourl: input.photourl ?? null,
        mosque: input.mosque ?? null,
        tahfiz: input.tahfiz ?? null,
      };

      const activityPost = activityPostRepo.create(cleanedInput);
      return await activityPostRepo.save(activityPost);
    }),

  update: protectedProcedure
    .input(
      z.object({ 
        id: z.number(),
        data: activityPostSchema 
      })
    )
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      const activityPost = await activityPostRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      activityPostRepo.merge(activityPost, cleanedInput);

      return await activityPostRepo.save(activityPost);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      return await activityPostRepo.delete(input);
    }),
});