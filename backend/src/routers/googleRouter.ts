import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { GoogleUserRecord } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";

export const googleRouter = router({
    create: publicProcedure
        .input(z.object({
            entityname: z.string(),
            entityid: z.number(),
            referenceno: z.string().nullable().optional(),
            status: z.string().nullable().optional(),
            googleuser: z.object({ id: z.number() }),
        }))
        .mutation(async ({ input }) => {
          const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);
          const record = userRecordRepo.create(input);
          return await userRecordRepo.save(record);
        }),
});