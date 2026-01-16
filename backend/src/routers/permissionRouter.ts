import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { Permission } from "../db/entities/Permission.entity.ts";

export const permissionRouter = router({
    getByUser: protectedProcedure
        .input(z.object({ userId: z.number() }))
        .query(({ input }) => {
            return AppDataSource.getRepository(Permission).find({
                where: { user: { id: input.userId } }
            });
        }),

    upsert: adminProcedure
    .input(z.object({
        userId: z.number(),
        slug: z.string(),
        enabled: z.boolean()
    }))
    .mutation(async ({ input }) => {
        const repo = AppDataSource.getRepository(Permission);

        const existing = await repo.findOne({
            where: {
            user: { id: input.userId },
            slug: input.slug
            }
        });

        if (existing) {
            existing.enabled = input.enabled;
            return repo.save(existing);
        }

        return repo.save(repo.create({
            slug: input.slug,
            enabled: input.enabled,
            user: { id: input.userId }
        }));
    })
});
