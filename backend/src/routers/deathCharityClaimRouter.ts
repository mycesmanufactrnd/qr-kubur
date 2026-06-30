// @ts-nocheck
import z from "zod";
import { protectedProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { DeathCharityClaim } from "../db/entities.js";
import { deathCharityClaimSchema } from "../schemas/deathCharityClaimSchema.js";

export const deathCharityClaimRouter = router({
    getPaginated: protectedProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            pageSize: z.number().min(1).default(10),
            filterDeceasedName: z.string().optional(),
            sortField: z.string().optional(),
            sortOrder: z.enum(["ASC", "DESC"]).optional(),
        }))
        .query(async ({ input }) => {
            const { page, pageSize, filterDeceasedName, sortField, sortOrder } = input;

            const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharityClaim);

            const query = deathCharityMemberRepo.createQueryBuilder('claim')
                .leftJoinAndSelect('claim.deathcharity', 'deathcharity')
                .leftJoinAndSelect('claim.member', 'member')
                .leftJoinAndSelect('claim.dependent', 'dependent');

            if (filterDeceasedName) {
                query.andWhere('claim.deceasedname ILIKE :name', { name: `%${filterDeceasedName}%` });
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize)
            }

            const allowedSortFields: Record<string, string> = {
                deceasedname: 'claim.deceasedname',
                payoutamount: 'claim.payoutamount',
                createdat: 'claim.createdat',
            };
            const orderCol = (sortField && allowedSortFields[sortField]) || 'claim.createdat';
            const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

            const [items, total] = await query
                .orderBy(orderCol, orderDir)
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
        .mutation(async ({ input }) => {
            const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
            const deathCharityClaim = await claimRepo.findOneByOrFail({ id: input.id });

            const cleanedInput = Object.fromEntries(
                Object.entries(input.data).filter(([_, v]) => v !== undefined)
            );
            
            claimRepo.merge(deathCharityClaim, cleanedInput);
            return await claimRepo.save(deathCharityClaim);
        }),

    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
            return await claimRepo.delete(input);
        }),
});