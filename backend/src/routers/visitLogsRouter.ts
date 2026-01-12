import z from "zod";
import { router, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { VisitLog } from "../db/entities/VisitLog.entity.ts";

export const visitLogsRouter = router({
    create: publicProcedure
        .input(
            z.object({
                visitorip: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ input }) => {
            const visitLogsRepo = AppDataSource.getRepository(VisitLog);

            const visitLog = visitLogsRepo.create(input);
            return await visitLogsRepo.save(visitLog);
        }),
});