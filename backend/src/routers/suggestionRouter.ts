import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc.ts";
import { z } from "zod";
import { AppDataSource } from "../datasource.ts";
import { Suggestion } from "../db/entities.ts";
import { suggestionApprovalSchema, suggestionSchema } from "../schemas/suggestionSchema.ts";

export const suggestionRouter = router({
    getPaginated: protectedProcedure
        .input(
            z.object({
            page: z.number().min(1).optional(),
            pageSize: z.number().min(1).optional(),
            currentUser: z.object({
            id: z.number(),
            organisation: z.object({ id: z.number() }).nullable(),
            tahfizcenter: z.object({ id: z.number() }).nullable(),
            }),
            checkRole: z.object({
                superadmin: z.boolean(),
                admin: z.boolean(),
                employee: z.boolean(),
                tahfiz: z.boolean(),
            }).optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize , currentUser, checkRole } = input;

            const suggestionRepo = AppDataSource.getRepository(Suggestion);

            const query = suggestionRepo.createQueryBuilder("suggestion");

            if (!checkRole?.superadmin) {
                if (currentUser.tahfizcenter) {
                    query.leftJoinAndSelect("suggestion.organisation", "organisation")
                        .andWhere("suggestion.tahfizcenterId = :tahfizId", { tahfizId: currentUser.tahfizcenter.id });
                }

                if (currentUser.organisation) {
                    query.leftJoinAndSelect("suggestion.tahfizcenter", "tahfizcenter")
                        .andWhere("suggestion.organisationId = :orgId", { orgId: currentUser.organisation.id });
                }
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("suggestion.createdat", "DESC")
                .getManyAndCount();

            return { items, total };
        }),

    update: protectedProcedure
        .input(z.object({ id: z.number(), data: suggestionApprovalSchema }))
        .mutation(async ({ input }) => {
            const suggestionRepo = AppDataSource.getRepository(Suggestion);
            const suggestion = await suggestionRepo.findOneByOrFail({ id: input.id });
    
            suggestionRepo.merge(suggestion, input.data);
    
            const savedSuggestion = await suggestionRepo.save(suggestion);
    
            return savedSuggestion;
        }),
    
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const suggestionRepo = AppDataSource.getRepository(Suggestion);
            return suggestionRepo.delete(input);
        }),
});