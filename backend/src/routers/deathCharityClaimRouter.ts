import z from "zod";
import { protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharityClaim } from "../db/entities.ts";
import { deathCharityClaimSchema } from "../schemas/deathCharityClaimSchema.ts";
import { getCurrentUserId } from "../helpers/requestContext.ts";

export const deathCharityClaimRouter = router({
    getPaginated: protectedProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            pageSize: z.number().min(1).default(10),
            filterDeceasedName: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const { page, pageSize, filterDeceasedName } = input;

            const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharityClaim);

            const query = deathCharityMemberRepo.createQueryBuilder('claim')
                .leftJoinAndSelect('claim.deathcharity', 'deathcharity')
                .leftJoinAndSelect('claim.member', 'member')
                .leftJoinAndSelect('claim.dependent', 'dependent');

            if (filterDeceasedName) query.andWhere('claim.deceasedname ILIKE :deceasedname', { deceasedname: `%${filterDeceasedName}%` });

            const [items, total] = await query
            .orderBy('claim.createdat', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

            return { items, total };
        }),

    create: protectedProcedure
        .input(deathCharityClaimSchema)
        .mutation(async ({ input }) => {
            const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
            const deathCharityClaim = claimRepo.create(input);

            return await claimRepo.save(deathCharityClaim);
        }),
    
    update: protectedProcedure
        .input(z.object({ id: z.number(), data: deathCharityClaimSchema }))
        .mutation(async ({ input, ctx }) => {
            const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
            const deathCharityClaim = await claimRepo.findOneByOrFail({ id: input.id });
            
            claimRepo.merge(deathCharityClaim, input.data);
            return await claimRepo.save(deathCharityClaim);
        }),

    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
            return await claimRepo.delete(input);
        }),
});