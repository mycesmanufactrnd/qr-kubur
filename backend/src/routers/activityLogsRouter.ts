import z from "zod";
import { router, superAdminProcedure, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { ActivityLog } from "../db/entities/ActivityLog.entity.ts";
import type { DeepPartial } from "@trpc/server";

export const activityLogsRouter = router({
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

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize)
            }

            const [items, total] = await query
                .orderBy("activitylog.createdat", "DESC")
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

            const cleanedInput: DeepPartial<ActivityLog> = {
                activitytype: input?.activitytype ?? null,
                functionname: input?.functionname ?? null,
                useremail: input?.useremail ?? null,
                level: input?.level ?? 'debug',
                summary: input?.summary ?? null,
                extramessage: input?.extramessage ?? null,
            }

            const log = logRepo.create(cleanedInput);
            return await logRepo.save(log);
        }),
});