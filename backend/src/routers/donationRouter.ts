import z from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { Donation } from "../db/entities.ts";
import { donationApprovalSchema, donationSchema } from "../schemas/donationSchema.ts";

export const donationRouter = router({
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

            const donationRepo = AppDataSource.getRepository(Donation);

            const query = donationRepo.createQueryBuilder("donation");
            query.leftJoinAndSelect("donation.paymentplatform", "paymentplatform")

            if(checkRole?.superadmin) {
                query.leftJoinAndSelect("donation.organisation", "organisation")
                    .leftJoinAndSelect("donation.tahfizcenter", "tahfizcenter");
            }

            if (!checkRole?.superadmin) {
                if (currentUser.tahfizcenter) {
                    query.leftJoinAndSelect("donation.organisation", "organisation")
                        .andWhere("donation.tahfizcenterId = :tahfizId", { tahfizId: currentUser.tahfizcenter.id });
                }

                if (currentUser.organisation) {
                    query.leftJoinAndSelect("donation.tahfizcenter", "tahfizcenter")
                        .andWhere("donation.organisationId = :orgId", { orgId: currentUser.organisation.id });
                }
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("donation.createdat", "DESC")
                .getManyAndCount();

            return { items, total };
        }),

    update: protectedProcedure
        .input(z.object({ id: z.number(), data: donationApprovalSchema }))
        .mutation(async ({ input }) => {
            const donationRepo = AppDataSource.getRepository(Donation);
            const donation = await donationRepo.findOneByOrFail({ id: input.id });
    
            donationRepo.merge(donation, input.data);
    
            const savedSuggestion = await donationRepo.save(donation);
    
            return savedSuggestion;
        }),

    create: publicProcedure
        .input(donationSchema)
        .mutation(async ({ input }) => {
            const donationRepo = AppDataSource.getRepository(Donation);

            const donation = donationRepo.create(input);
            return await donationRepo.save(donation);
        }),
});