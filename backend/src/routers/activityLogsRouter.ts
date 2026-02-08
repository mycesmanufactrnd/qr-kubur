import z from "zod";
import { router, superAdminProcedure, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { ActivityLog } from "../db/entities/ActivityLog.entity.ts";

export const activityLogsRouter = router({
    /**
     * Standardized: getPaginated
     * Uses server-side search, level filtering, and pagination.
     */
    getPaginated: superAdminProcedure
        .input(
            z.object({
                page: z.number().min(1).default(1),
                pageSize: z.number().min(1).default(20),
                search: z.string().optional(),
                level: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize, search, level } = input;
            const logRepo = AppDataSource.getRepository(ActivityLog);
            const query = logRepo.createQueryBuilder("activitylog");

            if (search?.trim()) {
                query.andWhere(
                    "(activitylog.summary ILIKE :search OR activitylog.useremail ILIKE :search OR activitylog.activitytype ILIKE :search)",
                    { search: `%${search.trim()}%` }
                );
            }

            if (level && level !== 'all') {
                query.andWhere("activitylog.level = :level", { level });
            }

            const [items, total] = await query
                .orderBy("activitylog.createdat", "DESC")
                .skip((page - 1) * pageSize)
                .take(pageSize)
                .getManyAndCount();

            return { items, total };
        }),

    create: publicProcedure
        .input(z.object({
            activitytype: z.string().optional().nullable(),
            functionname: z.string().optional().nullable(),
            useremail: z.string().optional().nullable(),
            level: z.string().default('debug'),
            summary: z.string().optional().nullable(),
            extramessage: z.string().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
            const logRepo = AppDataSource.getRepository(ActivityLog);
            const log = logRepo.create(input);
            return await logRepo.save(log);
        }),
});