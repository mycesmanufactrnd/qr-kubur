import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahlilRequest } from "../db/entities.ts";
import { tahlilRequestApprovalSchema, tahlilRequestSchema } from "../schemas/tahlilRequestSchema.ts";

export const tahlilRequestRouter = router({
    // 1. CREATE: Publicly accessible submission
    create: publicProcedure
        .input(tahlilRequestSchema)
        .mutation(async ({ input }) => {
            const repo = AppDataSource.getRepository(TahlilRequest);
            
            // TypeORM can handle the relation if input.tahfizcenter contains { id: number }
            const newRequest = repo.create(input);
            return await repo.save(newRequest);
        }),

    // 2. GET PAGINATED: Using input for user data
    getPaginated: protectedProcedure
        .input(
            z.object({
            page: z.number().min(1).default(1),
            pageSize: z.number().min(1).default(10),
            currentUser: z.object({
                id: z.number(),
                tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
            }),
            isTahfizAdmin: z.boolean().default(false),
            isSuperAdmin: z.boolean().default(false),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize, currentUser, isTahfizAdmin, isSuperAdmin } = input;
            const repo = AppDataSource.getRepository(TahlilRequest);

            const query = repo.createQueryBuilder("tahlilrequest")
            .leftJoinAndSelect("tahlilrequest.tahfizcenter", "tahfizcenter");

            if (isSuperAdmin) {
            // superadmin sees all
            } else if (isTahfizAdmin && currentUser.tahfizcenter?.id) {
            query.where("tahlilrequest.tahfizcenterId = :tahfizId", {
                tahfizId: currentUser.tahfizcenter.id,
            });
            } else {
            return { items: [], total: 0 };
            }

            const [items, total] = await query
            .orderBy("tahlilrequest.createdat", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

            // Map to match frontend UI fields
            const mappedItems = items.map(r => ({
            ...r,
            requester_name: r.requestorname,
            requester_phone: r.requestorphoneno,
            requester_email: r.requestoremail,
            deceasednames: r.deceasednames || [],
            selectedservices: r.selectedservices || [],
            tahfizcenter: r.tahfizcenter ? { id: r.tahfizcenter.id, name: r.tahfizcenter.name } : null,
            preferred_date: r.preferreddate,
            }));

            return { items: mappedItems, total };
        }),


    // 3. UPDATE: Reference the specific item by ID
    update: protectedProcedure
        .input(z.object({ id: z.number(), data: tahlilRequestApprovalSchema }))
        .mutation(async ({ input }) => {
            const repo = AppDataSource.getRepository(TahlilRequest);
            const tahlilRequest = await repo.findOneByOrFail({ id: input.id });
    
            // Merges the new status into the existing record
            repo.merge(tahlilRequest, input.data);
            return await repo.save(tahlilRequest);
        }),
    
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            return tahlilRequestRepo.delete(input);
        }),
});