import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahlilRequest } from "../db/entities.ts";
import { tahlilRequestApprovalSchema, tahlilRequestSchema } from "../schemas/tahlilRequestSchema.ts";

export const tahlilRequestRouter = router({
    getPaginated: protectedProcedure
        .input(
            z.object({
                page: z.number().min(1).optional(),
                pageSize: z.number().min(1).optional(),
                currentUser: z.object({
                    id: z.number(),
                    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
                }),
                isTahfizAdmin: z.boolean().default(false),
                isSuperAdmin : z.boolean().default(false),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize , currentUser, isTahfizAdmin, isSuperAdmin  } = input;

            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);

            const query = tahlilRequestRepo.createQueryBuilder("tahlilrequest");

            if (isSuperAdmin) { 
                query.leftJoinAndSelect("tahlilrequest.tahfizcenter", "tahfizcenter")
            }
            else if (isTahfizAdmin && currentUser.tahfizcenter) {
                query.leftJoinAndSelect("tahlilrequest.tahfizcenter", "tahfizcenter")
                    .where("tahlilrequest.tahfizcenterId = :tahfizId", {
                        tahfizId: currentUser.tahfizcenter.id,
                    });
            }
            else {
                return { items: [], total: 0 };
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("tahlilrequest.createdat", "DESC")
                .getManyAndCount();

            return { items, total };
        }),

    update: protectedProcedure
        .input(z.object({ id: z.number(), data: tahlilRequestApprovalSchema }))
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            const suggestion = await tahlilRequestRepo.findOneByOrFail({ id: input.id });
    
            tahlilRequestRepo.merge(suggestion, input.data);
    
            const savedSuggestion = await tahlilRequestRepo.save(suggestion);
    
            return savedSuggestion;
        }),
    
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            return tahlilRequestRepo.delete(input);
        }),
});