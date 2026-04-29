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

      const organisationIds = organisations.map((organisation) => organisation.id);

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

      const graveIds = graves.map((grave) => grave.id);

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
      const donationIdArr = donationIds.map((donation) => donation.id);

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

  // FOr Statistic
  // Chart: all time-series + distribution data for StatisticDashboard
  getStatisticChartData: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2000).max(2100),
        currentUserOrganisation: z.number().optional().nullable(),
        currentUserTahfiz: z.number().optional().nullable(),
        hasOrg: z.boolean().optional().default(false),
        hasTahfiz: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { year, currentUserOrganisation, currentUserTahfiz, hasOrg, hasTahfiz } = input;

      const graveRepo = AppDataSource.getRepository(Grave);
      const deadPersonRepo = AppDataSource.getRepository(DeadPerson);
      const donationRepo = AppDataSource.getRepository(Donation);
      const tahlilRepo = AppDataSource.getRepository(TahlilRequest);

      const fillMonths = (
        rows: { month: number; count: number; amount?: number }[],
      ) => {
        const map = new Map(rows.map((r) => [r.month, r]));
        return Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          count: map.get(i + 1)?.count ?? 0,
          amount: map.get(i + 1)?.amount ?? 0,
        }));
      };

      let orgIds: number[] = [];
      let graveIds: number[] = [];

      if (hasOrg && currentUserOrganisation) {
        const organisations = await AppDataSource.getRepository(Organisation)
          .createQueryBuilder("organisation")
          .select("organisation.id", "id")
          .where("organisation.id = :id OR organisation.parentorganisation = :id", {
            id: currentUserOrganisation,
          })
          .getRawMany();

        orgIds = organisations.map((organisation) => organisation.id);

        if (orgIds.length) {
          const graves = await graveRepo
            .createQueryBuilder("grave")
            .select("grave.id", "id")
            .where("grave.organisationId IN (:...ids)", { ids: orgIds })
            .getRawMany();
          graveIds = graves.map((grave) => grave.id);
        }
      }

      // --- Monthly Graves Added ---
      let monthlyGraves: { month: number; count: number; amount: number }[] = fillMonths([]);
      if (hasOrg && orgIds.length) {
        const rows = await graveRepo
          .createQueryBuilder("grave")
          .select("EXTRACT(MONTH FROM grave.createdat)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("EXTRACT(YEAR FROM grave.createdat) = :year", { year })
          .andWhere("grave.organisationId IN (:...ids)", { ids: orgIds })
          .groupBy("month")
          .orderBy("month")
          .getRawMany();

        monthlyGraves = fillMonths(
          rows.map((r) => ({ month: Number(r.month), count: Number(r.count) })),
        );
      }

      // --- Monthly Deceased Added ---
      let monthlyDeadPersons: { month: number; count: number; amount: number }[] = fillMonths([]);
      if (hasOrg && graveIds.length) {
        const rows = await deadPersonRepo
          .createQueryBuilder("deathperson")
          .select("EXTRACT(MONTH FROM deathperson.createdat)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("EXTRACT(YEAR FROM deathperson.createdat) = :year", { year })
          .andWhere("deathperson.graveId IN (:...ids)", { ids: graveIds })
          .groupBy("month")
          .orderBy("month")
          .getRawMany();

        monthlyDeadPersons = fillMonths(
          rows.map((r) => ({ month: Number(r.month), count: Number(r.count) })),
        );
      }

      // --- Monthly Donations ---
      let monthlyDonations: { month: number; count: number; amount: number }[] = fillMonths([]);
      if (hasOrg || hasTahfiz) {
        const conditions: string[] = [];
        if (currentUserOrganisation) conditions.push("donation.organisationId = :orgId");
        if (currentUserTahfiz) conditions.push("donation.tahfizcenterId = :tahfizId");

        if (conditions.length) {
          const rows = await donationRepo
            .createQueryBuilder("donation")
            .select("EXTRACT(MONTH FROM donation.createdat)::int", "month")
            .addSelect("COUNT(*)", "count")
            .addSelect("COALESCE(SUM(donation.amount), 0)", "amount")
            .where("EXTRACT(YEAR FROM donation.createdat) = :year", { year })
            .andWhere(`(${conditions.join(" OR ")})`, {
              orgId: currentUserOrganisation,
              tahfizId: currentUserTahfiz,
            })
            .groupBy("month")
            .orderBy("month")
            .getRawMany();
          monthlyDonations = fillMonths(
            rows.map((r) => ({
              month: Number(r.month),
              count: Number(r.count),
              amount: Number(r.amount),
            })),
          );
        }
      }

      // --- Monthly Tahlil Requests ---
      let monthlyTahlil: { month: number; count: number; amount: number }[] = fillMonths([]);
      if (hasTahfiz && currentUserTahfiz) {
        const rows = await tahlilRepo
          .createQueryBuilder("tahlil")
          .select("EXTRACT(MONTH FROM tahlil.createdat)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("EXTRACT(YEAR FROM tahlil.createdat) = :year", { year })
          .andWhere("tahlil.tahfizcenterId = :tahfizId", { tahfizId: currentUserTahfiz })
          .groupBy("month")
          .orderBy("month")
          .getRawMany();

        monthlyTahlil = fillMonths(
          rows.map((r) => ({ month: Number(r.month), count: Number(r.count) })),
        );
      }

      // --- Graves by State ---
      let gravesByState: { state: string; count: number }[] = [];
      if (hasOrg && orgIds.length) {
        const rows = await graveRepo
          .createQueryBuilder("grave")
          .select("grave.state", "state")
          .addSelect("COUNT(*)", "count")
          .where("grave.state IS NOT NULL")
          .andWhere("grave.organisationId IN (:...ids)", { ids: orgIds })
          .groupBy("grave.state")
          .orderBy("count", "DESC")
          .getRawMany();

        gravesByState = rows.map((r) => ({
          state: String(r.state || "Unknown"),
          count: Number(r.count),
        }));
      }

      // --- Donation status breakdown ---
      let donationsByStatus: { status: string; count: number; amount: number }[] = [];
      if (hasOrg || hasTahfiz) {
        const conditions: string[] = [];
        if (currentUserOrganisation) conditions.push("donation.organisationId = :orgId");
        if (currentUserTahfiz) conditions.push("donation.tahfizcenterId = :tahfizId");

        if (conditions.length) {
          const rows = await donationRepo
            .createQueryBuilder("donation")
            .select("donation.status", "status")
            .addSelect("COUNT(*)", "count")
            .addSelect("COALESCE(SUM(donation.amount), 0)", "amount")
            .where(`(${conditions.join(" OR ")})`, {
              orgId: currentUserOrganisation,
              tahfizId: currentUserTahfiz,
            })
            .groupBy("donation.status")
            .getRawMany();

          donationsByStatus = rows.map((r) => ({
            status: String(r.status),
            count: Number(r.count),
            amount: Number(r.amount),
          }));
        }
      }

      return {
        monthlyGraves,
        monthlyDeadPersons,
        monthlyDonations,
        monthlyTahlil,
        gravesByState,
        donationsByStatus,
      };
    }),

  // List: Paginated organisation list
  getStatisticOrgList: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(8),
        currentUserOrganisation: z.number().optional().nullable(),
        hasOrg: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, currentUserOrganisation, hasOrg } = input;
      if (!hasOrg || !currentUserOrganisation) return { items: [], total: 0 };

      const orgRepo = AppDataSource.getRepository(Organisation);
      const qb = orgRepo
        .createQueryBuilder("organisation")
        .where("organisation.id = :id OR organisation.parentorganisation = :id", {
          id: currentUserOrganisation,
        })
        .orderBy("organisation.name", "ASC");

      const total = await qb.getCount();
      const organisations = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        items: organisations.map((organisation) => ({
          id: organisation.id,
          name: organisation.name,
          address: organisation.address ?? null,
          status: organisation.status,
        })),
        total,
      };
    }),

  // List: Paginated grave list
  getStatisticGraveList: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(8),
        currentUserOrganisation: z.number().optional().nullable(),
        hasOrg: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, currentUserOrganisation, hasOrg } = input;
      if (!hasOrg || !currentUserOrganisation) return { items: [], total: 0 };

      const orgRepo = AppDataSource.getRepository(Organisation);
      const organisations = await orgRepo
        .createQueryBuilder("organisation")
        .select("organisation.id", "id")
        .where("organisation.id = :id OR organisation.parentorganisation = :id", {
          id: currentUserOrganisation,
        })
        .getRawMany();
      const orgIds = organisations.map((organisation) => organisation.id);
      if (!orgIds.length) return { items: [], total: 0 };

      const graveRepo = AppDataSource.getRepository(Grave);
      const qb = graveRepo
        .createQueryBuilder("grave")
        .leftJoinAndSelect("grave.organisation", "org")
        .where("grave.organisationId IN (:...ids)", { ids: orgIds })
        .orderBy("grave.name", "ASC");

      const total = await qb.getCount();
      const graves = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        items: graves.map((grave) => ({
          id: grave.id,
          name: grave.name ?? null,
          state: grave.state ?? null,
          block: grave.block ?? null,
          lot: grave.lot ?? null,
          status: grave.status,
          orgName: grave.organisation?.name ?? null,
        })),
        total,
      };
    }),

  // List: Paginated donation list
  getStatisticDonationList: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(8),
        currentUserOrganisation: z.number().optional().nullable(),
        currentUserTahfiz: z.number().optional().nullable(),
        hasOrg: z.boolean().optional().default(false),
        hasTahfiz: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        limit,
        currentUserOrganisation,
        currentUserTahfiz,
        hasOrg,
        hasTahfiz,
      } = input;
      if (!hasOrg && !hasTahfiz) return { items: [], total: 0 };

      const conditions: string[] = [];
      if (currentUserOrganisation) conditions.push("donation.organisationId = :orgId");
      if (currentUserTahfiz) conditions.push("donation.tahfizcenterId = :tahfizId");
      if (!conditions.length) return { items: [], total: 0 };

      const donationRepo = AppDataSource.getRepository(Donation);
      const qb = donationRepo
        .createQueryBuilder("donation")
        .leftJoinAndSelect("donation.organisation", "org")
        .leftJoinAndSelect("donation.tahfizcenter", "tahfiz")
        .where(`(${conditions.join(" OR ")})`, {
          orgId: currentUserOrganisation,
          tahfizId: currentUserTahfiz,
        })
        .orderBy("donation.createdat", "DESC");

      const total = await qb.getCount();
      const donations = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        items: donations.map((donation) => ({
          id: donation.id,
          donorname: donation.donorname ?? null,
          amount: Number(donation.amount ?? 0),
          status: donation.status,
          source: donation.organisation?.name ?? donation.tahfizcenter?.name ?? null,
          sourceType: donation.organisation ? "org" : "tahfiz",
          createdat: donation.createdat,
        })),
        total,
      };
    }),
});
