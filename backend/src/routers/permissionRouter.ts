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

    upsertMany: adminProcedure
        .input(z.object({
            userId: z.number(),
                permissions: z.array(z.object({
                slug: z.string(),
                enabled: z.boolean()
            }))
        }))
        .mutation(async ({ input }) => {
            const repo = AppDataSource.getRepository(Permission);

            const existing = await repo.find({
                where: {
                    user: { id: input.userId }
                }
            });

            const existingMap = new Map(
                existing.map(p => [p.slug, p])
            );

            const toSave = input.permissions.map(p => {
                const found = existingMap.get(p.slug);
                if (found) {
                    found.enabled = p.enabled;
                    return found;
                }
                return repo.create({
                    slug: p.slug,
                    enabled: p.enabled,
                    user: { id: input.userId }
                });
            });

            return repo.save(toSave);
        })

});
