import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { ActivityPost } from '../db/entities.ts';
import { activityPostSchema } from '../schemas/activityPostSchema.ts';

export const activityPostRouter = router({
  getPaginated: publicProcedure 
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterTitle: z.string().optional(),
      mosqueId: z.number().optional().nullable(),
      tahfizId: z.number().optional().nullable(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, filterTitle, mosqueId, tahfizId } = input;
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      const query = activityPostRepo.createQueryBuilder('posts');

      // Filtering Logic
      if (mosqueId) {
        query.andWhere('posts.mosqueId = :mId', { mId: mosqueId });
      } else if (tahfizId) {
        query.andWhere('posts.tahfizId = :tId', { tId: tahfizId });
      } else if (ctx.user && ctx.user.role !== 'SUPER_ADMIN') {
        if (ctx.user.mosqueId) {
          query.andWhere('posts.mosqueId = :mId', { mId: ctx.user.mosqueId });
        } else if (ctx.user.tahfizId) {
          query.andWhere('posts.tahfizId = :tId', { tId: ctx.user.tahfizId });
        }
      }

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
    .mutation(async ({ input, ctx }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);

      const activityPost = activityPostRepo.create({
        title: input.title,
        content: input.content,
        photourl: input.photourl,
        ispublished: input.ispublished,

        mosqueId: ctx.user?.mosqueId ?? input.mosqueId ?? input.mosque?.id,
        tahfizId: ctx.user?.tahfizId ?? input.tahfizId ?? input.tahfizcenter?.id,
      });

      return await activityPostRepo.save(activityPost);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: activityPostSchema }))
    .mutation(async ({ input, ctx }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      const activityPost = await activityPostRepo.findOneOrFail({
        where: {
          id: input.id,
          ...(ctx.user?.role !== 'SUPER_ADMIN' && {
            mosqueId: ctx.user?.mosqueId,
            tahfizId: ctx.user?.tahfizId
          })
        }
      });

      activityPost.title = input.data.title;
      activityPost.content = input.data.content;
      activityPost.photourl = input.data.photourl;
      activityPost.ispublished = input.data.ispublished;
      activityPost.mosqueId = input.data.mosqueId ?? input.data.mosque?.id ?? activityPost.mosqueId;
      activityPost.tahfizId = input.data.tahfizId ?? input.data.tahfizcenter?.id ?? activityPost.tahfizId;

      return await activityPostRepo.save(activityPost);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const activityPostRepo = AppDataSource.getRepository(ActivityPost);
      const activityPost = await activityPostRepo.findOneOrFail({
        where: {
          id: input,
          ...(ctx.user?.role !== 'SUPER_ADMIN' && {
            mosqueId: ctx.user?.mosqueId,
            tahfizId: ctx.user?.tahfizId
          })
        }
      });
      return await activityPostRepo.remove(activityPost);
    }),
});