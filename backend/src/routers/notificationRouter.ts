import z from "zod";
import { router, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { AdminNotification } from "../db/entities.ts";

export const notificationRouter = router({
    getUnreadNotificationCount: protectedProcedure
        .input(
            z.object({
                receiveremail: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { receiveremail } = input;

        return await AppDataSource.getRepository(AdminNotification).count({
            where: {
                receiveremail,
                isread: false,
            },
        })
    }),

    getPaginated: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).optional(),
                pageSize: z.number().min(1).optional(),
                receiveremail: z.string(),
                isread: z.boolean().default(false),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize, receiveremail, isread } = input;

            const adminNotiRepo = AppDataSource.getRepository(AdminNotification);

            const query = adminNotiRepo.createQueryBuilder("adminnotification");

            query.where("adminnotification.receiveremail = :email", { email: receiveremail })
                .where("adminnotification.isread = :readstatus", { readstatus: isread });

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("adminnotification.createdat", "DESC")
                .getManyAndCount();

            return { items, total };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                data: z.object({ 
                isread: z.boolean()
                })
            })
        )
        .mutation(async ({ input }) => {
            const notificationRepo = AppDataSource.getRepository(AdminNotification);
            const notification = await notificationRepo.findOneByOrFail({ id: input.id });
    
            notificationRepo.merge(notification, input.data);
    
            const savedNotification = await notificationRepo.save(notification);
    
            return savedNotification;
        }),
            
});