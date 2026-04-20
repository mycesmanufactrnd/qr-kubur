import z from "zod";
import { protectedProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import {
  DeadPerson,
  DeathCharity,
  DeathCharityClaim,
  DeathCharityMember,
  Donation,
  Grave,
  Organisation,
  Quotation,
  Suggestion,
  TahfizCenter,
  TahlilRequest,
} from "../db/entities.ts";
import {
  ClaimStatus,
  ORG_SHARE,
  QuotationStatus,
  TahlilStatus,
  VerificationStatus,
} from "../db/enums.ts";

export const dashboardRouter = router({
  // OGDS: Organisations, Graves, DeadPerson, Suggestion
  getOGDSAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserOrganisation } = input;

      const organisationRepo = AppDataSource.getRepository(Organisation);
      const graveRepo = AppDataSource.getRepository(Grave);
      const deadPersonRepo = AppDataSource.getRepository(DeadPerson);
      const suggestionRepo = AppDataSource.getRepository(Suggestion);

      if (isSuperAdmin) {
        return {
          organisationCount: await organisationRepo.count(),
          graveCount: await graveRepo.count(),
          deadPersonCount: await deadPersonRepo.count(),
          suggestionCount: await suggestionRepo.count(),
        };
      }

      if (!currentUserOrganisation) {
        return {
          organisationCount: 0,
          graveCount: 0,
          deadPersonCount: 0,
          suggestionCount: 0,
        };
      }

      const organisations = await organisationRepo
        .createQueryBuilder("organisation")
        .select("organisation.id", "id")
        .where(
          "organisation.id = :id OR organisation.parentorganisation = :id",
          { id: currentUserOrganisation },
        )
        .getRawMany();

      const organisationIds = organisations.map((o) => o.id);

      if (!organisationIds.length) {
        return {
          organisationCount: 0,
          graveCount: 0,
          deadPersonCount: 0,
          suggestionCount: 0,
        };
      }

      const graves = await graveRepo
        .createQueryBuilder("grave")
        .select("grave.id", "id")
        .where("grave.organisationId IN (:...ids)", { ids: organisationIds })
        .getRawMany();

      const graveIds = graves.map((g) => g.id);

      if (!graveIds.length) {
        return {
          organisationCount: organisationIds.length,
          graveCount: 0,
          deadPersonCount: 0,
          suggestionCount: 0,
        };
      }

      const [deadPersons, suggestions] = await Promise.all([
        deadPersonRepo
          .createQueryBuilder("deadperson")
          .select("deadperson.id", "id")
          .where("deadperson.graveId IN (:...ids)", { ids: graveIds })
          .getRawMany(),

        suggestionRepo
          .createQueryBuilder("suggestion")
          .select("suggestion.id", "id")
          .where("suggestion.graveId IN (:...ids)", { ids: graveIds })
          .getRawMany(),
      ]);

      return {
        organisationCount: organisationIds.length,
        graveCount: graveIds.length,
        deadPersonCount: deadPersons.length,
        suggestionCount: suggestions.length,
      };
    }),

  // TTR: Tahfiz, Tahlil Request
  getTTRAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserTahfiz: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserTahfiz } = input;

      const tahfizCenterRepo = AppDataSource.getRepository(TahfizCenter);
      const tahlilRequestRepo = AppDataSource.getRepository(TahlilRequest);

      if (isSuperAdmin) {
        return {
          tahfizCount: await tahfizCenterRepo.count(),
          tahlilRequestCount: await tahlilRequestRepo.count({
            where: { status: TahlilStatus.PENDING },
          }),
        };
      }

      if (!currentUserTahfiz) {
        return { tahfizCount: 0, tahlilRequestCount: 0 };
      }

      const tahfizIds = await tahfizCenterRepo
        .createQueryBuilder("tahfiz")
        .select("tahfiz.id", "id")
        .where("tahfiz.id = :id", { id: currentUserTahfiz })
        .getRawMany();

      const tahfizIdArr = tahfizIds.map((tahfiz) => tahfiz.id);

      const tahlilReqIds = await tahlilRequestRepo
        .createQueryBuilder("tahlilrequest")
        .select("tahlilrequest.id", "id")
        .where("tahlilrequest.tahfizcenterId IN (:...ids)", {
          ids: tahfizIdArr,
        })
        .andWhere("tahlilrequest.status = :status", {
          status: TahlilStatus.PENDING,
        })
        .getRawMany();

      const tahlilReqIdArr = tahlilReqIds.map((request) => request.id);

      return {
        tahfizCount: tahfizIdArr.length ?? 0,
        tahlilRequestCount: tahlilReqIdArr.length ?? 0,
      };
    }),

  // DDV: Donations, Donation Verified
  getDDVAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserTahfiz: z.number().optional().nullable(),
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserTahfiz, currentUserOrganisation } =
        input;

      const donationRepo = AppDataSource.getRepository(Donation);

      if (isSuperAdmin) {
        const totalVerifiedDonations = await donationRepo
          .createQueryBuilder("donation")
          .select("SUM(donation.amount)", "total")
          .where("donation.status = :status", {
            status: VerificationStatus.VERIFIED,
          })
          .getRawOne();

        const totalVerifiedAmount = Number(totalVerifiedDonations.total ?? 0);

        return {
          donationCount: await donationRepo.count({
            where: { status: VerificationStatus.PENDING },
          }),
          donationVerified: totalVerifiedAmount,
        };
      }

      const query = donationRepo
        .createQueryBuilder("donation")
        .select("donation.id", "id");

      if (currentUserTahfiz) {
        query.orWhere("donation.tahfizcenterId = :tahfizId", {
          tahfizId: currentUserTahfiz,
        });
      }

      if (currentUserOrganisation) {
        query.orWhere("donation.organisationId = :orgId", {
          orgId: currentUserOrganisation,
        });
      }

      const donationIds = await query.getRawMany();
      const donationIdArr = donationIds.map((d) => d.id);

      let totalVerifiedAmount = 0;
      if (donationIdArr.length > 0) {
        const totalVerifiedDonations = await donationRepo
          .createQueryBuilder("donation")
          .select("SUM(donation.amount)", "total")
          .where("donation.status = :status", {
            status: VerificationStatus.VERIFIED,
          })
          .andWhere("donation.id IN (:...ids)", { ids: donationIdArr })
          .getRawOne();

        totalVerifiedAmount = Number(totalVerifiedDonations.total ?? 0);
      }

      return {
        donationCount: donationIdArr.length ?? 0,
        donationVerified: totalVerifiedAmount,
      };
    }),

  // CMC: Charity, Member, Claim
  getCMCAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserOrganisation } = input;

      const deathCharityRepo = AppDataSource.getRepository(DeathCharity);
      const deathCharityMemberRepo =
        AppDataSource.getRepository(DeathCharityMember);
      const deathCharityClaimRepo =
        AppDataSource.getRepository(DeathCharityClaim);

      if (isSuperAdmin) {
        const totalPaidClaim = await deathCharityClaimRepo
          .createQueryBuilder("claim")
          .select("SUM(claim.payoutamount)", "total")
          .where("claim.status = :status", { status: ClaimStatus.PAID })
          .getRawOne();

        const totalPayoutAmount = Number(totalPaidClaim.total ?? 0);

        return {
          deathCharityCount: await deathCharityRepo.count(),
          deathCharityMemberCount: await deathCharityMemberRepo.count(),
          deathCharityTotalPayout: totalPayoutAmount,
        };
      }

      const deathCharityCount = await deathCharityRepo
        .createQueryBuilder("deathcharity")
        .where("deathcharity.organisationId = :id", {
          id: currentUserOrganisation,
        })
        .getCount();

      const totalDeathCharityMember = await deathCharityMemberRepo
        .createQueryBuilder("member")
        .leftJoin("member.deathcharity", "deathcharity")
        .where("deathcharity.organisationId = :id", {
          id: currentUserOrganisation,
        })
        .getCount();

      const totalPaidClaim = await deathCharityClaimRepo
        .createQueryBuilder("claim")
        .leftJoin("claim.deathcharity", "deathcharity")
        .where("deathcharity.organisationId = :id", {
          id: currentUserOrganisation,
        })
        .andWhere("claim.status = :status", { status: ClaimStatus.PAID })
        .select("SUM(claim.payoutamount)", "total")
        .getRawOne();

      const totalPayoutAmount = Number(totalPaidClaim.total ?? 0);

      return {
        deathCharityCount: deathCharityCount,
        deathCharityMemberCount: totalDeathCharityMember,
        deathCharityTotalPayout: totalPayoutAmount,
      };
    }),

  // QUO: Quotation
  getQuotationStates: protectedProcedure
    .input(
      z.object({
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserOrganisation } = input;

      const quotationRepo = AppDataSource.getRepository(Quotation);

      const qb = quotationRepo
        .createQueryBuilder("quotation")
        .select([
          `COUNT(*) FILTER (WHERE quotation.status = :pending) as "pendingCount"`,
          `COUNT(*) FILTER (WHERE quotation.status = :completed) as "completedCount"`,
          `COALESCE(SUM(quotation.serviceamount * ${ORG_SHARE}) FILTER (WHERE quotation.status = :completed), 0) as "totalServiceAmount"`,
        ])
        .setParameters({
          pending: QuotationStatus.PENDING,
          completed: QuotationStatus.COMPLETED,
        });

      if (!isSuperAdmin) {
        if (!currentUserOrganisation) {
          return {
            totalPendingQuo: 0,
            totalCompleteQuo: 0,
            totalPayoutQuo: 0,
          };
        }

        qb.where("quotation.organisationId = :id", {
          id: currentUserOrganisation,
        });
      }

      const stats = await qb.getRawOne();

      return {
        totalPendingQuo: Number(stats.pendingCount),
        totalCompleteQuo: Number(stats.completedCount),
        totalPayoutQuo: Number(stats.totalServiceAmount),
      };
    }),
});
