import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { GoogleUserRecord, TahlilRequest } from "../db/entities.ts";
import { tahlilRequestApprovalSchema, tahlilRequestLiveURL, tahlilRequestSchema } from "../schemas/tahlilRequestSchema.ts";
import { In } from "typeorm";

export const tahlilRequestRouter = router({
    getByReferenceNo: publicProcedure
        .input(z.object({ 
            referenceno: z.string().optional().nullable() 
        }))
        .query(async ({ input }) => {

            if (!input.referenceno) {
                return null;
            }

            const repo = AppDataSource.getRepository(TahlilRequest);

            return await repo.findOne({
                where: { referenceno: input.referenceno },
                relations: ['tahfizcenter']
            });
        }),
        
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

    create: publicProcedure
        .input(tahlilRequestSchema.extend({
          googleuserId: z.number().optional().nullable(),
        }))
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            const tahlilRequest = tahlilRequestRepo.create(input);
            const savedTahlilRequest = await tahlilRequestRepo.save(tahlilRequest);
    
            if (input.googleuserId) {
                const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);
                const record = userRecordRepo.create({
                    entityname: "tahlilrequest",
                    entityid: savedTahlilRequest.id,
                    referenceno: savedTahlilRequest.referenceno,
                    status: savedTahlilRequest.status,
                    googleuser: { id: input.googleuserId },
                });
        
                await userRecordRepo.save(record);
            }
    
            return savedTahlilRequest;
        }),
            
    update: protectedProcedure
        .input(z.object({ id: z.number(), data: tahlilRequestApprovalSchema }))
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            const tahlilRequests = await tahlilRequestRepo.findOneByOrFail({ id: input.id });
    
            tahlilRequestRepo.merge(tahlilRequests, input.data);
    
            const savedTahlilRequests = await tahlilRequestRepo.save(tahlilRequests);
    
            return savedTahlilRequests;
        }),

    updateLiveURL: protectedProcedure
        .input(z.object({ 
            ids: z.array(z.number()), 
            data: tahlilRequestLiveURL 
        }))
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            
            const tahlilRequests = await tahlilRequestRepo.findBy({ id: In(input.ids) });

            tahlilRequests.forEach(tr => {
                tahlilRequestRepo.merge(tr, input.data);
            });

            const saved = await tahlilRequestRepo.save(tahlilRequests);

            return saved;
        }),
    
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);
            return tahlilRequestRepo.delete(input);
        }),

    countRequestByTahfizId: publicProcedure
        .input(z.object({ id: z.number().min(1) }))
        .query(async ({ input }) => {
            const repo = AppDataSource.getRepository(TahlilRequest);

        const result = await repo
            .createQueryBuilder("request")
            .select("request.status", "status")
            .addSelect("COUNT(request.id)", "count")
            .where("request.tahfizcenterId = :id", { id: input.id })
            .groupBy("request.status")
            .getRawMany();

        return {
            pending:
                Number(result.find(r => r.status === "pending")?.count ?? 0),
            completed:
                Number(result.find(r => r.status === "completed")?.count ?? 0),
            };
    }),

});