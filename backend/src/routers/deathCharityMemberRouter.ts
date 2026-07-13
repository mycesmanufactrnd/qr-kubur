// @ts-nocheck
import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import {
  DeathCharityClaim,
  DeathCharityDependent,
  DeathCharityMember,
  JenazahCase,
  Mosque,
  Organisation,
  QariahDevice,
} from "../db/entities.js";
import { deathCharityMemberSchema } from "../schemas/deathCharityMemberSchema.js";
import { claimFromMemberSchema } from "../schemas/deathCharityClaimSchema.js";
import {
  sendNotificationFCMToOrganisation,
  sendNotificationToQariahDevices,
} from "../services/firebase.service.js";

const stripIcDashes = (value) =>
  typeof value === "string" ? value.replace(/-/g, "").trim() : value;

export const deathCharityMemberRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterFullName: z.string().optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filterFullName, sortField, sortOrder } = input;

      const deathCharityMemberRepo =
        AppDataSource.getRepository(DeathCharityMember);

      const query = deathCharityMemberRepo.createQueryBuilder("member");
      query.innerJoinAndSelect("member.deathcharity", "deathcharity");
      query.leftJoinAndSelect("member.claims", "memberclaims");
      query.leftJoinAndSelect("member.dependents", "dependents");
      query.leftJoinAndSelect("dependents.claims", "dependentsclaims");

      if (filterFullName) {
        query.andWhere("member.fullname ILIKE :fullname", {
          fullname: `%${filterFullName}%`,
        });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const allowedSortFields: Record<string, string> = {
        fullname: "member.fullname",
        createdat: "member.createdat",
      };
      const orderCol =
        (sortField && allowedSortFields[sortField]) || "member.createdat";
      const orderDir = sortOrder === "ASC" ? "ASC" : "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(deathCharityMemberSchema)
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo =
        AppDataSource.getRepository(DeathCharityMember);

      const icnumber = stripIcDashes(input.icnumber);

      const existing = await deathCharityMemberRepo.findOne({
        where: { icnumber },
      });

      if (existing) {
        throw new Error("IC number is already registered.");
      }

      const deathCharity = deathCharityMemberRepo.create({
        ...input,
        icnumber,
        isapproved: true,
      });

      return await deathCharityMemberRepo.save(deathCharity);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: deathCharityMemberSchema }))
    .mutation(async ({ input }) => {
      const deathCharityMemberRepo =
        AppDataSource.getRepository(DeathCharityMember);
      const deathCharity = await deathCharityMemberRepo.findOneByOrFail({
        id: input.id,
      });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      if (cleanedInput.icnumber !== undefined) {
        cleanedInput.icnumber = stripIcDashes(cleanedInput.icnumber);
      }

      // Auto-derive organisation from mosque when mosque changes
      if (input.data.mosque !== undefined) {
        if (input.data.mosque?.id) {
          const mosqueRepo = AppDataSource.getRepository(Mosque);
          const mosque = await mosqueRepo.findOne({
            where: { id: input.data.mosque.id },
            relations: ["organisation"],
          });
          cleanedInput.organisation = mosque?.organisation ?? null;
        } else {
          cleanedInput.organisation = null;
        }
      }

      deathCharityMemberRepo.merge(deathCharity, cleanedInput);
      return await deathCharityMemberRepo.save(deathCharity);
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const deathCharityMemberRepo =
      AppDataSource.getRepository(DeathCharityMember);

    const member = await deathCharityMemberRepo.findOne({
      where: { id: input },
      relations: ["mosque"],
    });

    if (member && !member.isapproved) {
      // A still-pending registration is being deleted — this is a rejection.
      await sendNotificationToQariahDevices({
        icnumber: member.icnumber,
        notification: {
          title: "Pendaftaran Qariah Ditolak",
          body: `Pendaftaran anda sebagai ahli qariah ${member.mosque?.name ?? ""} tidak diluluskan.`,
        },
      });
      await AppDataSource.getRepository(QariahDevice).delete({
        icnumber: member.icnumber,
      });
    }

    return await deathCharityMemberRepo.delete(input);
  }),

  getMemberByDeathCharity: protectedProcedure
    .input(
      z.object({
        deathcharityId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { deathcharityId, isSuperAdmin } = input;

      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      if (isSuperAdmin) {
        return await memberRepo.find();
      }

      return await memberRepo.find({
        where: {
          deathcharity: {
            id: deathcharityId,
          },
        },
      });
    }),

  searchByDeathCharity: publicProcedure
    .input(
      z.object({
        deathcharityId: z.number(),
        keyword: z.string().trim().min(1),
        limit: z.number().min(1).max(25).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { deathcharityId, keyword, limit } = input;
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      return await memberRepo
        .createQueryBuilder("member")
        .leftJoin("member.deathcharity", "deathcharity")
        .where("deathcharity.id = :deathcharityId", { deathcharityId })
        .andWhere(
          "(member.fullname ILIKE :keyword OR member.icnumber ILIKE :keyword)",
        )
        .setParameter("keyword", `%${keyword}%`)
        .orderBy("member.fullname", "ASC")
        .take(limit)
        .getMany();
    }),

  getQariahPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(20),
        filterFullName: z.string().optional().nullable(),
        filterOrganisationId: z.number().optional().nullable(),
        filterMosqueId: z.number().optional().nullable(),
        filterIsDeceased: z.boolean().optional().nullable(),
        filterIsApproved: z.boolean().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterFullName,
        filterOrganisationId,
        filterMosqueId,
        filterIsDeceased,
        filterIsApproved,
      } = input;
      const repo = AppDataSource.getRepository(DeathCharityMember);
      const query = repo
        .createQueryBuilder("member")
        .leftJoinAndSelect("member.organisation", "organisation")
        .leftJoinAndSelect("member.mosque", "mosque")
        .leftJoinAndSelect("member.deadperson", "deadperson")
        .leftJoinAndSelect("deadperson.grave", "deadpersongrave")
        .where("member.organisationId IS NOT NULL");

      if (filterFullName?.trim()) {
        query.andWhere("member.fullname ILIKE :name", {
          name: `%${filterFullName.trim()}%`,
        });
      }
      if (filterOrganisationId) {
        query.andWhere("member.organisationId = :organisationId", {
          organisationId: filterOrganisationId,
        });
      }
      if (filterMosqueId) {
        query.andWhere("member.mosqueId = :mosqueId", {
          mosqueId: filterMosqueId,
        });
      }
      if (filterIsDeceased !== undefined && filterIsDeceased !== null) {
        query.andWhere("member.isdeceased = :isdeceased", {
          isdeceased: filterIsDeceased,
        });
      }
      if (filterIsApproved !== undefined && filterIsApproved !== null) {
        query.andWhere("member.isapproved = :isapproved", {
          isapproved: filterIsApproved,
        });
      }

      query
        .orderBy("member.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize);
      const [items, total] = await query.getManyAndCount();
      return { items, total };
    }),

  getMosquesByState: publicProcedure
    .input(
      z.object({
        state: z.string().optional().nullable(),
        organisationId: z.number().optional().nullable(),
        canArrangeFuneral: z.boolean().optional(),
        hasDeathCharity: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Mosque);
      const query = repo.createQueryBuilder("mosque");
      if (input.state) {
        query.where("mosque.state = :state", { state: input.state });
      }

      if (input.organisationId) {
        query.andWhere("mosque.organisationId = :orgId", {
          orgId: input.organisationId,
        });
      }
      
      if (input.canArrangeFuneral) {
        query.andWhere("mosque.canarrangefuneral = true");
      }

      if (input.hasDeathCharity) {
        query.andWhere("mosque.hasdeathcharity = true");
      }
       
      return query
        .select(["mosque.id", "mosque.name", "mosque.state", "mosque.address"])
        .orderBy("mosque.name", "ASC")
        .getMany();
    }),

  getOrganisations: publicProcedure
    .input(
      z.object({
        state: z.string().optional().nullable(),
        organisationId: z.number().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      // Only organisations with mosque management enabled
      const query = repo
        .createQueryBuilder("organisation")
        .where("organisation.canmanagemosque = :can", { can: true });

      if (input.state) {
        query.andWhere(":state = ANY(organisation.states)", {
          state: input.state,
        });
      }

      if (input.organisationId) {
        // Load the relation to check parent vs child — FK column not directly selectable
        const callerOrg = await repo.findOne({
          where: { id: input.organisationId },
          relations: ["parentorganisation"],
        });
        if (!callerOrg?.parentorganisation) {
          // Top-level org: show itself + all direct children
          query.andWhere(
            "(organisation.id = :orgId OR organisation.parentorganisationId = :orgId)",
            { orgId: input.organisationId },
          );
        } else {
          // Child org: show only itself
          query.andWhere("organisation.id = :orgId", {
            orgId: input.organisationId,
          });
        }
      }

      return query
        .select([
          "organisation.id",
          "organisation.name",
          "organisation.states",
          "organisation.address",
        ])
        .orderBy("organisation.name", "ASC")
        .getMany();
    }),

  registerQariah: publicProcedure
    .input(
      z.object({
        fullname: z.string().min(1),
        icnumber: z.string().min(1),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        mosque: z.object({ id: z.number() }).optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);

      const icnumber = stripIcDashes(input.icnumber);

      const existing = await memberRepo.findOne({
        where: { icnumber },
      });

      if (existing) {
        throw new Error("IC number is already registered.");
      }

      // Auto-derive organisation from mosque
      let organisation = null;
      if (input.mosque?.id) {
        const mosqueRepo = AppDataSource.getRepository(Mosque);
        const mosque = await mosqueRepo.findOne({
          where: { id: input.mosque.id },
          relations: ["organisation"],
        });
        organisation = mosque?.organisation ?? null;
      }

      const member = memberRepo.create({
        fullname: input.fullname,
        icnumber,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        mosque: input.mosque ?? null,
        organisation,
        isapproved: false,
      });
      const savedMember = await memberRepo.save(member);

      if (organisation?.id) {
        await sendNotificationFCMToOrganisation({
          organisationId: organisation.id,
          event: "qariah_registered",
          inputData: { fullname: input.fullname },
          roles: ["admin"],
        });
      }

      return savedMember;
    }),

  createPublic: publicProcedure
    .input(deathCharityMemberSchema)
    .mutation(async ({ input }) => {
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const deathCharityId = input.deathcharity?.id;

      if (!deathCharityId) {
        throw new Error("Death charity is required.");
      }

      const icnumber = stripIcDashes(input.icnumber || "");

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
    .input(
      z.object({
        memberId: z.number(),
        isSuperAdmin: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { memberId, isSuperAdmin } = input;

      const dependentRepo = AppDataSource.getRepository(DeathCharityDependent);

      if (isSuperAdmin) {
        return await dependentRepo.find();
      }

      return await dependentRepo.find({
        where: {
          member: {
            id: memberId,
          },
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
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { member, dependents } = input;

      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const dependentRepo = AppDataSource.getRepository(DeathCharityDependent);

      const deathCharityMember = await memberRepo.findOne({
        where: { id: member.id },
      });
      if (!deathCharityMember)
        throw new Error("Death charity member not found");

      const existingDependents = await dependentRepo.find({
        where: { member: { id: member.id } },
      });

      for (const dependent of dependents) {
        if (dependent.id) {
          const existing = await dependentRepo.findOneByOrFail({
            id: dependent.id,
          });

          dependentRepo.merge(existing, {
            fullname: dependent.fullname,
            icnumber: stripIcDashes(dependent.icnumber),
            relationship: dependent.relationship,
          });

          await dependentRepo.save(existing);
        } else {
          const entity = dependentRepo.create({
            fullname: dependent.fullname,
            icnumber: stripIcDashes(dependent.icnumber),
            relationship: dependent.relationship,
            member: { id: member.id },
          });
          await dependentRepo.save(entity);
        }
      }

      const idsToKeep = dependents
        .filter((dependent) => dependent.id)
        .map((dependent) => dependent.id);
      const toDelete = existingDependents.filter(
        (existing) => !idsToKeep.includes(existing.id),
      );

      if (toDelete.length > 0) {
        try {
          await dependentRepo.delete(toDelete.map((d) => d.id));
        } catch (error: any) {
          if (error.code === "23503" || error.message.includes("foreign key")) {
            throw new Error(
              "Cannot delete dependent because there are associated claims. Delete claims first.",
            );
          }
          throw error;
        }
      }

      return dependents;
    }),

  approveMember: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(DeathCharityMember);
      const member = await repo.findOne({
        where: { id: input },
        relations: ["mosque"],
      });
      if (!member) throw new Error("Death charity member not found");

      member.isapproved = true;
      const savedMember = await repo.save(member);

      await AppDataSource.getRepository(QariahDevice).update(
        { icnumber: member.icnumber },
        { isapproved: true },
      );
      await sendNotificationToQariahDevices({
        icnumber: member.icnumber,
        notification: {
          title: "Pendaftaran Qariah Diluluskan",
          body: `Pendaftaran anda sebagai ahli qariah ${member.mosque?.name ?? ""} telah diluluskan.`,
        },
      });

      return savedMember;
    }),

  searchByIcNumber: publicProcedure
    .input(
      z.object({
        icnumber: z.string(),
        mosqueId: z.number().optional().nullable(),
        searchCase: z.boolean().default(false),
        searchMany: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      if (!input.icnumber?.trim()) return input.searchMany ? [] : null;

      const icnumber = stripIcDashes(input.icnumber);

      if (input.searchMany) {
        return await AppDataSource.getRepository(DeathCharityMember).find({
          where: { icnumber },
          relations: ["mosque", "organisation", "deadperson"],
        });
      }

      const member = await AppDataSource.getRepository(DeathCharityMember).findOne({
        where: {
          icnumber,
          ...(input.mosqueId ? { mosqueId: input.mosqueId } : {}),
        },
        relations: ["mosque", "organisation", "deadperson"],
      });

      if (!input.searchCase) return member;

      const existingCase = await AppDataSource.getRepository(JenazahCase)
        .createQueryBuilder("caserequest")
        .leftJoinAndSelect("caserequest.mosque", "mosque")
        .where("caserequest.details->>'deceasedIcnumber' = :icnumber", { icnumber })
        .orderBy("caserequest.createdat", "DESC")
        .getOne();

      return { member, existingCase };
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
        }),
      );

      return await claimRepo.save(claimEntities);
    }),
});
