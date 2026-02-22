import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { DeathCharity, DeathCharityClaim, DeathCharityDependent, DeathCharityMember } from "../db/entities.ts";
import { deathCharityMemberSchema } from "../schemas/deathCharityMemberSchema.ts";
import { claimFromMemberSchema } from "../schemas/deathCharityClaimSchema.ts";

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
        query.leftJoinAndSelect('member.claims', 'memberclaims');
        query.leftJoinAndSelect('member.dependents', 'dependents');
        query.leftJoinAndSelect('dependents.claims', 'dependentsclaims');

      if (filterFullName) {
        query.andWhere('member.fullname ILIKE :fullname', { fullname: `%${filterFullName}%` });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('member.createdat', 'DESC')
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

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      deathCharityMemberRepo.merge(deathCharity, cleanedInput);
      return await deathCharityMemberRepo.save(deathCharity);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo = AppDataSource.getRepository(DeathCharity);
      return await deathCharityMemberRepo.delete(input);
    }),

  getMemberByDeathCharity: protectedProcedure
    .input(z.object({
        deathcharityId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }))
    .query(async ({ input }) => {
      const { deathcharityId, isSuperAdmin } = input;

      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      if (isSuperAdmin) {
        return await memberRepo.find();
      }

      return await memberRepo.find({
        where: { 
          deathcharity: { 
            id: deathcharityId 
          } 
        },
      });
    }),

  searchByDeathCharity: publicProcedure
    .input(z.object({
      deathcharityId: z.number(),
      keyword: z.string().trim().min(1),
      limit: z.number().min(1).max(25).default(10),
    }))
    .query(async ({ input }) => {
      const { deathcharityId, keyword, limit } = input;
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      return await memberRepo
        .createQueryBuilder("member")
        .leftJoin("member.deathcharity", "deathcharity")
        .where("deathcharity.id = :deathcharityId", { deathcharityId })
        .andWhere("(member.fullname ILIKE :keyword OR member.icnumber ILIKE :keyword)")
        .setParameter("keyword", `%${keyword}%`)
        .orderBy("member.fullname", "ASC")
        .take(limit)
        .getMany();
    }),

  createPublic: publicProcedure
    .input(deathCharityMemberSchema)
    .mutation(async ({ input }) => {
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const deathCharityId = input.deathcharity?.id;

      if (!deathCharityId) {
        throw new Error("Death charity is required.");
      }

      const icnumber = (input.icnumber || "").trim();
      const existingMember = await memberRepo
        .createQueryBuilder("member")
        .leftJoin("member.deathcharity", "deathcharity")
        .where("deathcharity.id = :deathcharityId", { deathcharityId })
        .andWhere("LOWER(member.icnumber) = LOWER(:icnumber)", { icnumber })
        .getOne();

      if (existingMember) {
        return existingMember;
      }

      const payload = {
        ...input,
        fullname: (input.fullname || "").trim(),
        icnumber,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
      };

      const member = memberRepo.create(payload);
      return await memberRepo.save(member);
    }),

  getDependentsByMember: protectedProcedure
    .input(z.object({
        memberId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }))
    .query(async ({ input }) => {
      const { memberId, isSuperAdmin } = input;

      const dependentRepo = AppDataSource.getRepository(DeathCharityDependent);

      if (isSuperAdmin) {
        return await dependentRepo.find();
      }

      return await dependentRepo.find({
        where: { 
          member: { 
            id: memberId
          } 
        },
      });
    }),

  upsertDependents: protectedProcedure
    .input(
      z.object({
        member: z.object({ id: z.number() }).nullable().optional(),
        dependents: z.array(
          z.object({
            id: z.number().optional(),
            fullname: z.string().min(1),
            icnumber: z.string().min(1),
            relationship: z.enum(["spouse", "child"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { member, dependents } = input;

      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const dependentRepo = AppDataSource.getRepository(DeathCharityDependent);

      const deathCharityMember = await memberRepo.findOne({ where: { id: member.id } });
      if (!deathCharityMember) throw new Error("Death charity member not found");

      const existingDependents = await dependentRepo.find({
        where: { member: { id: member.id } },
      });

      for (const dependent of dependents) {
        if (dependent.id) {
          const existing = await dependentRepo.findOneByOrFail({ id: dependent.id });

          dependentRepo.merge(existing, {
            fullname: dependent.fullname,
            icnumber: dependent.icnumber,
            relationship: dependent.relationship,
          });

          await dependentRepo.save(existing);
        } else {
          const entity = dependentRepo.create({
            fullname: dependent.fullname,
            icnumber: dependent.icnumber,
            relationship: dependent.relationship,
            member: { id: member.id },
          });
          await dependentRepo.save(entity);
        }
      }

      const idsToKeep = dependents.filter(dependent => dependent.id).map(dependent => dependent.id);
      const toDelete = existingDependents.filter(
        existing => !idsToKeep.includes(existing.id)
      );

      if (toDelete.length > 0) {
        try {
          await dependentRepo.delete(toDelete.map(d => d.id));
        } catch (error: any) {
          if (
            error.code === "23503" || 
            error.message.includes("foreign key")
          ) {
            throw new Error(
              "Cannot delete dependent because there are associated claims. Delete claims first."
            );
          }
          throw error;
        }
      }

      // for (const dependent of toDelete) {
      //   await dependentRepo.softRemove(dependent);
      // }

      return dependents;
    }),

  createClaims: protectedProcedure
    .input(claimFromMemberSchema)
    .mutation(async ({ input }) => {
      const { claims } = input;

      const claimRepo = AppDataSource.getRepository(DeathCharityClaim);
      const claimEntities = claims.map((c) =>
        claimRepo.create({
          deceasedname: c.deceasedname,
          relationship: c.relationship,
          payoutamount: c.payoutamount,
          member: c.member?.id ?? null,
          dependent: c.dependent?.id ?? null,
          deathcharity: c.deathcharity?.id ?? null,
        })
      );

      return await claimRepo.save(claimEntities);
    }),
});
