// @ts-nocheck
import z from "zod";
import { Brackets } from "typeorm";
import { protectedProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import {
  DeadPerson,
  DeathCharity,
  DeathCharityClaim,
  DeathCharityMember,
  Donation,
  Grave,
  JenazahCase,
  Mosque,
  Organisation,
  KariahDeathNotification,
  Quotation,
  Suggestion,
  TahfizCenter,
  TahlilRequest,
  User,
} from "../db/entities.js";
import {
  ClaimStatus,
  ORG_SHARE,
  QuotationStatus,
  TahlilStatus,
  VerificationStatus,
} from "../db/enums.js";

const PARENT_ORGANISATION_TYPE = "Majlis Agama Islam";

// Scope is derived from the logged-in user, never from client input: the
// user's own organisation plus its direct child organisations.
const resolveOrgFamily = async (userId) => {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: Number(userId) },
    relations: ["organisation", "organisation.organisationtype"],
  });
  const rootId = user?.organisation?.id;
  if (!rootId) return null;

  const organisations = await AppDataSource.getRepository(Organisation)
    .createQueryBuilder("organisation")
    .select("organisation.id", "id")
    .addSelect("organisation.name", "name")
    .addSelect("organisation.latitude", "latitude")
    .addSelect("organisation.longitude", "longitude")
    .addSelect("organisation.states", "states")
    .where("organisation.id = :id OR organisation.parentorganisation = :id", {
      id: rootId,
    })
    .orderBy("organisation.name", "ASC")
    .getRawMany();

  return {
    rootId,
    organisations,
    ids: organisations.map((o) => Number(o.id)),
    isParent:
      user.organisation.organisationtype?.name === PARENT_ORGANISATION_TYPE ||
      organisations.some((o) => Number(o.id) !== rootId),
  };
};

const toNumber = (value) => Number(value ?? 0) || 0;
const toCoordinate = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

export const dashboardRouter = router({
  getParentOrgStatus: protectedProcedure.query(async ({ ctx }) => {
    const family = await resolveOrgFamily(ctx.user.id);
    return { isParent: !!family?.isParent };
  }),

  getParentOverview: protectedProcedure
    .input(z.object({ year: z.number().int().min(2000).max(2100) }))
    .query(async ({ ctx, input }) => {
      const family = await resolveOrgFamily(ctx.user.id);
      if (!family) return null;

      const { ids, rootId } = family;
      const { year } = input;
      const years = [year - 1, year];

      const [
        mosqueRows,
        graveRows,
        arwahByOrg,
        arwahByState,
        arwahMonthly,
        jenazahByStatus,
        jenazahByOrg,
        jenazahByState,
        jenazahMonthly,
        topMosques,
        kariahRows,
        kariahByOrg,
        khairatSchemes,
        khairatMembers,
        khairatPayout,
        notificationCount,
      ] = await Promise.all([
        AppDataSource.getRepository(Mosque)
          .createQueryBuilder("mosque")
          .innerJoin("mosque.organisation", "org")
          .select("mosque.id", "id")
          .addSelect("mosque.name", "name")
          .addSelect("mosque.state", "state")
          .addSelect("mosque.latitude", "latitude")
          .addSelect("mosque.longitude", "longitude")
          .addSelect("org.id", "organisationId")
          .where("org.id IN (:...ids)", { ids })
          .getRawMany(),

        AppDataSource.getRepository(Grave)
          .createQueryBuilder("grave")
          .innerJoin("grave.organisation", "org")
          .select("grave.id", "id")
          .addSelect("grave.name", "name")
          .addSelect("grave.state", "state")
          .addSelect("grave.latitude", "latitude")
          .addSelect("grave.longitude", "longitude")
          .addSelect("org.id", "organisationId")
          .where("org.id IN (:...ids)", { ids })
          .getRawMany(),

        AppDataSource.getRepository(DeadPerson)
          .createQueryBuilder("deadperson")
          .innerJoin("deadperson.grave", "grave")
          .innerJoin("grave.organisation", "org")
          .select("org.id", "organisationId")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("org.id")
          .getRawMany(),

        AppDataSource.getRepository(DeadPerson)
          .createQueryBuilder("deadperson")
          .innerJoin("deadperson.grave", "grave")
          .innerJoin("grave.organisation", "org")
          .select("grave.state", "state")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("grave.state")
          .getRawMany(),

        AppDataSource.getRepository(DeadPerson)
          .createQueryBuilder("deadperson")
          .innerJoin("deadperson.grave", "grave")
          .innerJoin("grave.organisation", "org")
          .select("EXTRACT(YEAR FROM deadperson.dateofdeath)::int", "year")
          .addSelect("EXTRACT(MONTH FROM deadperson.dateofdeath)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .andWhere("EXTRACT(YEAR FROM deadperson.dateofdeath) IN (:...years)", {
            years,
          })
          .groupBy("year")
          .addGroupBy("month")
          .getRawMany(),

        AppDataSource.getRepository(JenazahCase)
          .createQueryBuilder("jenazahcase")
          .innerJoin("jenazahcase.mosque", "mosque")
          .innerJoin("mosque.organisation", "org")
          .select("jenazahcase.status", "status")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("jenazahcase.status")
          .getRawMany(),

        AppDataSource.getRepository(JenazahCase)
          .createQueryBuilder("jenazahcase")
          .innerJoin("jenazahcase.mosque", "mosque")
          .innerJoin("mosque.organisation", "org")
          .select("org.id", "organisationId")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("org.id")
          .getRawMany(),

        AppDataSource.getRepository(JenazahCase)
          .createQueryBuilder("jenazahcase")
          .innerJoin("jenazahcase.mosque", "mosque")
          .innerJoin("mosque.organisation", "org")
          .select("mosque.state", "state")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("mosque.state")
          .getRawMany(),

        AppDataSource.getRepository(JenazahCase)
          .createQueryBuilder("jenazahcase")
          .innerJoin("jenazahcase.mosque", "mosque")
          .innerJoin("mosque.organisation", "org")
          .select("EXTRACT(YEAR FROM jenazahcase.createdat)::int", "year")
          .addSelect("EXTRACT(MONTH FROM jenazahcase.createdat)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .andWhere("EXTRACT(YEAR FROM jenazahcase.createdat) IN (:...years)", {
            years,
          })
          .groupBy("year")
          .addGroupBy("month")
          .getRawMany(),

        AppDataSource.getRepository(JenazahCase)
          .createQueryBuilder("jenazahcase")
          .innerJoin("jenazahcase.mosque", "mosque")
          .innerJoin("mosque.organisation", "org")
          .select("mosque.id", "id")
          .addSelect("mosque.name", "name")
          .addSelect("mosque.state", "state")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("mosque.id")
          .addGroupBy("mosque.name")
          .addGroupBy("mosque.state")
          .orderBy("count", "DESC")
          .limit(5)
          .getRawMany(),

        AppDataSource.getRepository(DeathCharityMember)
          .createQueryBuilder("member")
          .innerJoin("member.organisation", "org")
          .select("member.isapproved", "isapproved")
          .addSelect("member.isdeceased", "isdeceased")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("member.isapproved")
          .addGroupBy("member.isdeceased")
          .getRawMany(),

        AppDataSource.getRepository(DeathCharityMember)
          .createQueryBuilder("member")
          .innerJoin("member.organisation", "org")
          .select("org.id", "organisationId")
          .addSelect("COUNT(*)", "count")
          .where("org.id IN (:...ids)", { ids })
          .groupBy("org.id")
          .getRawMany(),

        AppDataSource.getRepository(DeathCharity)
          .createQueryBuilder("deathcharity")
          .innerJoin("deathcharity.organisation", "org")
          .where("org.id IN (:...ids)", { ids })
          .getCount(),

        AppDataSource.getRepository(DeathCharityMember)
          .createQueryBuilder("member")
          .innerJoin("member.deathcharity", "deathcharity")
          .innerJoin("deathcharity.organisation", "org")
          .where("org.id IN (:...ids)", { ids })
          .getCount(),

        AppDataSource.getRepository(DeathCharityClaim)
          .createQueryBuilder("claim")
          .innerJoin("claim.deathcharity", "deathcharity")
          .innerJoin("deathcharity.organisation", "org")
          .select("COALESCE(SUM(claim.payoutamount), 0)", "total")
          .where("org.id IN (:...ids)", { ids })
          .andWhere("claim.status = :status", { status: ClaimStatus.PAID })
          .getRawOne(),

        AppDataSource.getRepository(KariahDeathNotification)
          .createQueryBuilder("notification")
          .innerJoin("notification.organisation", "org")
          .where("org.id IN (:...ids)", { ids })
          .getCount(),
      ]);

      const countBy = (rows, key) =>
        new Map(rows.map((r) => [String(r[key]), toNumber(r.count)]));

      const arwahOrgMap = countBy(arwahByOrg, "organisationId");
      const jenazahOrgMap = countBy(jenazahByOrg, "organisationId");
      const kariahOrgMap = countBy(kariahByOrg, "organisationId");

      const mosques = mosqueRows.map((m) => ({
        id: Number(m.id),
        name: m.name,
        state: m.state,
        latitude: toCoordinate(m.latitude),
        longitude: toCoordinate(m.longitude),
        organisationId: Number(m.organisationId),
      }));

      const graves = graveRows.map((g) => ({
        id: Number(g.id),
        name: g.name,
        state: g.state,
        latitude: toCoordinate(g.latitude),
        longitude: toCoordinate(g.longitude),
        organisationId: Number(g.organisationId),
      }));

      const organisations = family.organisations.map((o) => {
        const id = Number(o.id);
        return {
          id,
          name: o.name,
          latitude: toCoordinate(o.latitude),
          longitude: toCoordinate(o.longitude),
          states: o.states ?? [],
          isRoot: id === rootId,
          mosqueCount: mosques.filter((m) => m.organisationId === id).length,
          graveCount: graves.filter((g) => g.organisationId === id).length,
          arwahCount: arwahOrgMap.get(String(id)) ?? 0,
          jenazahCount: jenazahOrgMap.get(String(id)) ?? 0,
          kariahCount: kariahOrgMap.get(String(id)) ?? 0,
        };
      });

      const jenazahStatus = countBy(jenazahByStatus, "status");
      const jenazah = {
        pending: jenazahStatus.get("pending") ?? 0,
        ongoing: jenazahStatus.get("ongoing") ?? 0,
        closed: jenazahStatus.get("closed") ?? 0,
        rejected: jenazahStatus.get("rejected") ?? 0,
      };

      const kariah = { total: 0, approved: 0, pending: 0, deceased: 0 };
      for (const row of kariahRows) {
        const count = toNumber(row.count);
        kariah.total += count;
        if (row.isapproved) kariah.approved += count;
        else kariah.pending += count;
        if (row.isdeceased) kariah.deceased += count;
      }

      const monthlyCount = (rows, y, m) =>
        toNumber(
          rows.find((r) => Number(r.year) === y && Number(r.month) === m)
            ?.count,
        );
      const monthly = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        arwah: monthlyCount(arwahMonthly, year, i + 1),
        arwahPrev: monthlyCount(arwahMonthly, year - 1, i + 1),
        jenazah: monthlyCount(jenazahMonthly, year, i + 1),
        jenazahPrev: monthlyCount(jenazahMonthly, year - 1, i + 1),
      }));

      const stateMap = new Map();
      const bumpState = (state, key, amount = 1) => {
        if (!state) return;
        const entry = stateMap.get(state) ?? {
          state,
          mosques: 0,
          graves: 0,
          arwah: 0,
          jenazah: 0,
        };
        entry[key] += amount;
        stateMap.set(state, entry);
      };
      mosques.forEach((m) => bumpState(m.state, "mosques"));
      graves.forEach((g) => bumpState(g.state, "graves"));
      arwahByState.forEach((r) => bumpState(r.state, "arwah", toNumber(r.count)));
      jenazahByState.forEach((r) =>
        bumpState(r.state, "jenazah", toNumber(r.count)),
      );

      return {
        year,
        isParent: family.isParent,
        organisations,
        mosques,
        graves,
        totals: {
          organisations: organisations.length,
          mosques: mosques.length,
          graves: graves.length,
          arwah: organisations.reduce((sum, o) => sum + o.arwahCount, 0),
          arwahThisYear: monthly.reduce((sum, m) => sum + m.arwah, 0),
          jenazah: {
            ...jenazah,
            total: Object.values(jenazah).reduce((a, b) => a + b, 0),
          },
          jenazahThisYear: monthly.reduce((sum, m) => sum + m.jenazah, 0),
          kariah,
          khairat: {
            schemes: khairatSchemes,
            members: khairatMembers,
            payout: toNumber(khairatPayout?.total),
          },
          notifications: notificationCount,
        },
        monthly,
        topMosquesByJenazah: topMosques.map((m) => ({
          id: Number(m.id),
          name: m.name,
          state: m.state,
          count: toNumber(m.count),
        })),
        states: [...stateMap.values()].sort(
          (a, b) => b.arwah + b.jenazah - (a.arwah + a.jenazah),
        ),
      };
    }),

  // OS: Organisations,Suggestion
  getOSAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserOrganisation } = input;

      const organisationRepo = AppDataSource.getRepository(Organisation);
      const suggestionRepo = AppDataSource.getRepository(Suggestion);

      if (isSuperAdmin) {
        return {
          organisationCount: await organisationRepo.count(),
          suggestionCount: await suggestionRepo.count(),
        };
      }

      if (!currentUserOrganisation) {
        return {
          organisationCount: 0,
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

      const organisationIds = organisations.map(
        (organisation) => organisation.id,
      );

      if (!organisationIds.length) {
        return {
          organisationCount: 0,
          suggestionCount: 0,
        };
      }

      const suggestions = await suggestionRepo
        .createQueryBuilder("suggestion")
        .select("suggestion.id", "id")
        .where("suggestion.graveId IN (:...ids)", {
          ids: [currentUserOrganisation],
        })
        .getRawMany();

      return {
        organisationCount: organisationIds.length,
        suggestionCount: suggestions.length,
      };
    }),

  // GD: Graves, DeadPerson
  getGDAdminStates: protectedProcedure
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

      // Super Admin → count everything
      if (isSuperAdmin) {
        const [graveCount, deadPersonCount] = await Promise.all([
          graveRepo.count(),
          deadPersonRepo.count(),
        ]);

        return { graveCount, deadPersonCount };
      }

      if (!currentUserOrganisation) {
        return { graveCount: 0, deadPersonCount: 0 };
      }

      // Get organisation IDs (self + children)
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
        return { graveCount: 0, deadPersonCount: 0 };
      }

      // Count graves directly (no fetching rows)
      const graveCount = await graveRepo
        .createQueryBuilder("grave")
        .where("grave.organisationId IN (:...ids)", { ids: organisationIds })
        .getCount();

      if (!graveCount) {
        return { graveCount: 0, deadPersonCount: 0 };
      }

      // Count dead persons using subquery (no graveIds array needed)
      const deadPersonCount = await deadPersonRepo
        .createQueryBuilder("deadperson")
        .innerJoin(
          "deadperson.grave",
          "grave",
          "grave.organisationId IN (:...ids)",
          { ids: organisationIds },
        )
        .getCount();

      return { graveCount, deadPersonCount };
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
        .select("donation.id", "id")
        .where("donation.status = :status", {
          status: VerificationStatus.PENDING,
        })
        .andWhere(
          new Brackets((qb) => {
            if (currentUserTahfiz) {
              qb.orWhere("donation.tahfizcenterId = :tahfizId", {
                tahfizId: currentUserTahfiz,
              });
            }

            if (currentUserOrganisation) {
              qb.orWhere("donation.organisationId = :orgId", {
                orgId: currentUserOrganisation,
              });
            }
          }),
        );

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

  // CQN: Case, Kariah, Notifications
  getCQNAdminStates: protectedProcedure
    .input(
      z.object({
        currentUserOrganisation: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input }) => {
      const { isSuperAdmin, currentUserOrganisation } = input;
      const notifRepo = AppDataSource.getRepository(KariahDeathNotification);
      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const jenazahCaseRepo = AppDataSource.getRepository(JenazahCase);

      if (isSuperAdmin) {
        const [
          notificationCount,
          memberCount,
          jenazahCaseCount,
          jenazahCasePendingCount,
          deathCharityMemberPendingCount,
        ] = await Promise.all([
          notifRepo.count(),
          memberRepo
            .createQueryBuilder("member")
            .where("member.organisationId IS NOT NULL")
            .getCount(),
          jenazahCaseRepo.count(),
          jenazahCaseRepo.count({ where: { status: "pending" } }),
          memberRepo.count({ where: { isapproved: false } }),
        ]);

        return {
          kariahNotificationCount: notificationCount,
          kariahMemberCount: memberCount,
          jenazahCaseCount,
          jenazahCasePendingCount,
          deathCharityMemberPendingCount,
        };
      }

      if (!currentUserOrganisation) {
        return {
          kariahNotificationCount: 0,
          kariahMemberCount: 0,
          jenazahCaseCount: 0,
          jenazahCasePendingCount: 0,
          deathCharityMemberPendingCount: 0,
        };
      }

      const [
        notificationCount,
        memberCount,
        jenazahCaseCount,
        jenazahCasePendingCount,
        deathCharityMemberPendingCount,
      ] = await Promise.all([
        notifRepo
          .createQueryBuilder("noti")
          .leftJoin("noti.organisation", "organisation")
          .where("organisation.id = :id", { id: currentUserOrganisation })
          .getCount(),

        memberRepo
          .createQueryBuilder("member")
          .where("member.organisationId = :id", {
            id: currentUserOrganisation,
          })
          .getCount(),

        jenazahCaseRepo
          .createQueryBuilder("jenazahCase")
          .leftJoin("jenazahCase.mosque", "mosque")
          .where("mosque.organisationId = :id", { id: currentUserOrganisation })
          .getCount(),

        jenazahCaseRepo
          .createQueryBuilder("jenazahCase")
          .leftJoin("jenazahCase.mosque", "mosque")
          .where("mosque.organisationId = :id", { id: currentUserOrganisation })
          .andWhere("jenazahCase.status = :status", { status: "pending" })
          .getCount(),

        memberRepo
          .createQueryBuilder("member")
          .where("member.organisationId = :id", { id: currentUserOrganisation })
          .andWhere("member.isapproved = :val", { val: false })
          .getCount(),
      ]);

      return {
        kariahNotificationCount: notificationCount,
        kariahMemberCount: memberCount,
        jenazahCaseCount,
        jenazahCasePendingCount,
        deathCharityMemberPendingCount,
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

  // For Statistic
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
      const {
        year,
        currentUserOrganisation,
        currentUserTahfiz,
        hasOrg,
        hasTahfiz,
      } = input;

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
          .where(
            "organisation.id = :id OR organisation.parentorganisation = :id",
            {
              id: currentUserOrganisation,
            },
          )
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
      let monthlyGraves: { month: number; count: number; amount: number }[] =
        fillMonths([]);
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
      let monthlyDeadPersons: {
        month: number;
        count: number;
        amount: number;
      }[] = fillMonths([]);
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
      let monthlyDonations: { month: number; count: number; amount: number }[] =
        fillMonths([]);
      if (hasOrg || hasTahfiz) {
        const conditions: string[] = [];
        if (currentUserOrganisation)
          conditions.push("donation.organisationId = :orgId");
        if (currentUserTahfiz)
          conditions.push("donation.tahfizcenterId = :tahfizId");

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
      let monthlyTahlil: { month: number; count: number; amount: number }[] =
        fillMonths([]);
      if (hasTahfiz && currentUserTahfiz) {
        const rows = await tahlilRepo
          .createQueryBuilder("tahlil")
          .select("EXTRACT(MONTH FROM tahlil.createdat)::int", "month")
          .addSelect("COUNT(*)", "count")
          .where("EXTRACT(YEAR FROM tahlil.createdat) = :year", { year })
          .andWhere("tahlil.tahfizcenterId = :tahfizId", {
            tahfizId: currentUserTahfiz,
          })
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
      let donationsByStatus: {
        status: string;
        count: number;
        amount: number;
      }[] = [];
      if (hasOrg || hasTahfiz) {
        const conditions: string[] = [];
        if (currentUserOrganisation)
          conditions.push("donation.organisationId = :orgId");
        if (currentUserTahfiz)
          conditions.push("donation.tahfizcenterId = :tahfizId");

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
        .where(
          "organisation.id = :id OR organisation.parentorganisation = :id",
          {
            id: currentUserOrganisation,
          },
        )
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
        .where(
          "organisation.id = :id OR organisation.parentorganisation = :id",
          {
            id: currentUserOrganisation,
          },
        )
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
      if (currentUserOrganisation)
        conditions.push("donation.organisationId = :orgId");
      if (currentUserTahfiz)
        conditions.push("donation.tahfizcenterId = :tahfizId");
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
          source:
            donation.organisation?.name ?? donation.tahfizcenter?.name ?? null,
          sourceType: donation.organisation ? "org" : "tahfiz",
          createdat: donation.createdat,
        })),
        total,
      };
    }),
});
