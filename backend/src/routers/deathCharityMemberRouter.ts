import z from "zod";
import { protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharity, DeathCharityMember } from "../db/entities.ts";
import { deathCharityMemberSchema } from "../schemas/deathCharityMemberSchema.ts";

export const deathCharityMemberRouter = router({
    getPaginated: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterFullName: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { page, pageSize, filterFullName } = input;
  
        const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharityMember);
  
        const query = deathCharityMemberRepo.createQueryBuilder('member');
        query.leftJoinAndSelect('member.deathcharity', 'deathcharity');
  
        if (filterFullName) query.andWhere('member.fullname ILIKE :fullname', { fullname: `%${filterFullName}%` });
  
        const [items, total] = await query
          .orderBy('member.joinedat', 'DESC')
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getManyAndCount();
  
        return { items, total };
      }),

  create: protectedProcedure
    .input(deathCharityMemberSchema)
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharityMember);
      const deathCharity = deathCharityMemberRepo.create(input);
      return await deathCharityMemberRepo.save(deathCharity);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deathCharityMemberSchema }))
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharityMember);
      const deathCharity = await deathCharityMemberRepo.findOneByOrFail({ id: input.id });
      deathCharityMemberRepo.merge(deathCharity, input.data);
      return await deathCharityMemberRepo.save(deathCharity);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharity);
      return await deathCharityMemberRepo.delete(input);
    }),

  getDeathCharityByOrganisation: protectedProcedure
    .input(z.object({
        organisationId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }))
      .query(async ({ input }) => {
        const { organisationId, isSuperAdmin } = input;

        const deathCharityRepo = AppDataSource.getRepository(DeathCharity);

        if (isSuperAdmin) {
          return await deathCharityRepo.find({
            select: {
              id: true,
              name: true,
            }
          });
        }

        return await deathCharityRepo.find({
          where: { 
            organisation: { 
              id: organisationId 
            } 
          },
          select: {
            id: true,
            name: true,
          }
        });
      }),
});