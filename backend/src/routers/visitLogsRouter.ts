// @ts-nocheck
import z from "zod";
import { router, publicProcedure } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { VisitLog } from "../db/entities/VisitLog.entity.js";

export const visitLogsRouter = router({
    create: publicProcedure
        .input(
            z.object({
                grave: z.object({ id: z.number() }).nullable().optional(),
                deadperson: z.object({ id: z.number() }).nullable().optional(),
                visitorip: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ input }) => {
            const visitLogsRepo = AppDataSource.getRepository(VisitLog);

            const visitLog = visitLogsRepo.create(input);
            return await visitLogsRepo.save(visitLog);
        }),
});