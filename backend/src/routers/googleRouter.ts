import z from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { GoogleUser, GoogleUserRecord } from "../db/entities.ts";
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

    getTransactionRecords: publicProcedure
        .input(z.object({
            email: z.string().email(),
        }))
        .query(async ({ input }) => {
            const googleUserRepo = AppDataSource.getRepository(GoogleUser);
            const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);

            const googleUser = await googleUserRepo
                .createQueryBuilder("googleuser")
                .where("LOWER(googleuser.email) = LOWER(:email)", { email: input.email.trim() })
                .getOne();

            if (!googleUser) {
                return [];
            }

            const records = await userRecordRepo.find({
                where: { googleuser: { id: googleUser.id } },
                order: { createdat: "DESC" },
            });

            return records.map((record) => ({
                id: record.id,
                referenceno: record.referenceno,
                entityname: record.entityname,
                createdat: record.createdat,
            }));
        }),
});
