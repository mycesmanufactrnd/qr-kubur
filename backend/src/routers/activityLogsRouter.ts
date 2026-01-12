import z from "zod";
import { router, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { ActivityLog } from "../db/entities/ActivityLog.entity.ts";

export const activityLogsRouter = router({
    getPaginated: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).optional(),
                pageSize: z.number().min(1).optional(),
                checkRole: z.object({
                    superadmin: z.boolean(),
                }).optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize , checkRole } = input;
            
            if(!checkRole?.superadmin) {
                return { items: [], total: 0 };
            }
            
            const logRepo = AppDataSource.getRepository(ActivityLog);

            const query = logRepo.createQueryBuilder("activitylog");
            
            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("activitylog.createdat", "DESC")
                .getManyAndCount();

            return { items, total };

        }),
});