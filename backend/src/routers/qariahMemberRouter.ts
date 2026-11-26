// @ts-nocheck
import z from "zod";
import { In } from "typeorm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import {
  GoogleUser,
  KariahDevice,
  Mosque,
  QariahMember,
  User,
} from "../db/entities.js";
import { QariahMemberStatus } from "../db/enums.js";
import {
  sendNotificationFCMToOrganisation,
  sendNotificationToKariahDevices,
  verifyFirebaseIdToken,
} from "../services/firebase.service.js";
import { rateLimited } from "../middleware/rateLimit.js";
import { hashForSearch } from "../helpers/cryptoHelper.js";

const stripIcDashes = (value: string) => value.replace(/-/g, "").trim();

// A rejected registration doesn't block (or show up for) a new one.
const ACTIVE_STATUSES = [QariahMemberStatus.PENDING, QariahMemberStatus.APPROVED];

// Staff only — a Google-user token must never reach member PII.
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["superadmin", "admin", "employee"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// The mosque admin's scope, from the logged-in user — never from client input.
// null = superadmin (every organisation).
const resolveScopeOrgId = async (ctx): Promise<number | null> => {
  if (ctx.user.role === "superadmin") return null;
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: Number(ctx.user.id) },
    relations: ["organisation"],
  });
  if (!user?.organisation?.id) throw new TRPCError({ code: "FORBIDDEN" });
  return user.organisation.id;
};

// Links a registration to the Google account signed in on the device. The id
// comes from a verified Firebase ID token (same check as auth.loginGoogle),
// never from client input, so it can't be pointed at someone else's account.
// No token / invalid token / unknown account -> null (registers unlinked).
const resolveGoogleUserId = async (idToken?: string | null): Promise<number | null> => {
  if (!idToken) return null;
  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded?.email) return null;
    const googleUser = await AppDataSource.getRepository(GoogleUser).findOne({
      where: { email: decoded.email },
      select: { id: true },
    });
    return googleUser?.id ?? null;
  } catch {
    return null;
  }
};

const findPendingInScope = async (ctx, id: number) => {
  const orgId = await resolveScopeOrgId(ctx);
  const member = await AppDataSource.getRepository(QariahMember).findOne({
    where: { id },
    relations: { mosque: { organisation: true } },
  });
  if (!member || (orgId !== null && member.mosque?.organisation?.id !== orgId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
  }
  if (member.status !== QariahMemberStatus.PENDING) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Registration has already been processed",
    });
  }
  return member;
};

export const qariahMemberRouter = router({
  // Public registration (UserKariahRegistration). Returns nothing about the
  // saved record.
  register: rateLimited(5, 60 * 1000, "Too many registration attempts. Please try again later.")
    .input(
      z.object({
        fullname: z.string().trim().min(1),
        icnumber: z.string().trim().min(1),
        gender: z.enum(["male", "female"]).optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        // column sizes: postcode varchar(10), city/state varchar(100)
        postcode: z.string().trim().max(10).optional().nullable(),
        city: z.string().trim().max(100).optional().nullable(),
        state: z.string().trim().max(100).optional().nullable(),
        maritalstatus: z
          .enum(["single", "married", "divorced", "widowed"])
          .optional()
          .nullable(),
        spousename: z.string().trim().max(255).optional().nullable(),
        spouseicnumber: z.string().trim().max(20).optional().nullable(),
        numberofchildren: z.number().int().min(0).max(99).optional().nullable(),
        numberofhouseholdmembers: z
          .number()
          .int()
          .min(0)
          .max(99)
          .optional()
          .nullable(),
        mosqueId: z.number(),
        // Firebase ID token of the Google user signed in on the device, if any
        googleIdToken: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(QariahMember);
      const icno = stripIcDashes(input.icnumber);
      const isMarried = input.maritalstatus === "married";

      const existing = await repo.findOne({
        where: { icnohash: hashForSearch(icno), status: In(ACTIVE_STATUSES) },
        select: { id: true },
      });
      if (existing) throw new Error("IC number is already registered.");

      const mosque = await AppDataSource.getRepository(Mosque).findOne({
        where: { id: input.mosqueId },
        relations: ["organisation"],
      });
      if (!mosque) throw new Error("Mosque not found");

      const googleUserId = await resolveGoogleUserId(input.googleIdToken);

      await repo.save(
        repo.create({
          fullname: input.fullname,
          icno,
          gender: input.gender || null,
          phoneno: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          postcode: input.postcode || null,
          city: input.city || null,
          state: input.state || null,
          maritalstatus: input.maritalstatus || null,
          // spouse details only make sense for a married registrant
          spousename: isMarried ? input.spousename || null : null,
          spouseicno:
            isMarried && input.spouseicnumber
              ? stripIcDashes(input.spouseicnumber) || null
              : null,
          numberofchildren: input.numberofchildren ?? null,
          numberofhouseholdmembers: input.numberofhouseholdmembers ?? null,
          googleUserId,
          mosqueId: mosque.id,
          status: QariahMemberStatus.PENDING,
        }),
      );

      if (mosque.organisation?.id) {
        await sendNotificationFCMToOrganisation({
          organisationId: mosque.organisation.id,
          event: "kariah_registered",
          inputData: { fullname: input.fullname },
          roles: ["admin"],
        });
      }

      return { success: true };
    }),

  // Public status check for the user-side card / registration page: ONLY
  // approval status + mosque, never name, IC or contact details.
  checkStatus: rateLimited(20, 60 * 1000, "Too many requests. Please try again shortly.")
    .input(
      z.object({
        icnumber: z.string().trim().min(1),
        mosqueId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const member = await AppDataSource.getRepository(QariahMember).findOne({
        where: {
          icnohash: hashForSearch(stripIcDashes(input.icnumber)),
          mosqueId: input.mosqueId,
          status: In(ACTIVE_STATUSES),
        },
        // createdat must be selected for the ORDER BY to work with the join
        select: {
          id: true,
          status: true,
          createdat: true,
          mosque: { id: true, name: true },
        },
        relations: { mosque: true },
        order: { createdat: "DESC" },
      });
      if (!member) return null;

      return {
        isapproved: member.status === QariahMemberStatus.APPROVED,
        mosque: member.mosque
          ? { id: member.mosque.id, name: member.mosque.name }
          : null,
      };
    }),

  // The signed-in Google user's own registrations ("Masjid Berdaftar").
  // A mutation only so the Firebase token travels in the POST body, not in a
  // GET query string where proxies and access logs would keep it.
  listMine: rateLimited(20, 60 * 1000, "Too many requests. Please try again shortly.")
    .input(z.object({ googleIdToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const googleUserId = await resolveGoogleUserId(input.googleIdToken);
      // FORBIDDEN, not UNAUTHORIZED: the frontend's global handler treats
      // UNAUTHORIZED as an expired *admin* session and refreshes/clears it.
      if (!googleUserId) throw new TRPCError({ code: "FORBIDDEN" });

      const rows = await AppDataSource.getRepository(QariahMember).find({
        where: { googleUserId },
        relations: { mosque: true },
        order: { createdat: "DESC" },
      });

      return rows.map((m) => ({
        id: m.id,
        fullname: m.fullname,
        status: m.status,
        notes: m.status === QariahMemberStatus.REJECTED ? m.notes : null,
        createdat: m.createdat,
        approvedat: m.approvedat,
        mosque: m.mosque
          ? {
              id: m.mosque.id,
              name: m.mosque.name,
              state: m.mosque.state,
              photourl: m.mosque.photourl,
            }
          : null,
      }));
    }),

  getPaginated: staffProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        filterFullName: z.string().optional().nullable(),
        filterMosqueId: z.number().optional().nullable(),
        filterStatus: z.enum(["pending", "approved", "rejected"]).optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const orgId = await resolveScopeOrgId(ctx);
      const query = AppDataSource.getRepository(QariahMember)
        .createQueryBuilder("member")
        .leftJoinAndSelect("member.mosque", "mosque");

      if (orgId !== null) {
        query.andWhere("mosque.organisationId = :orgId", { orgId });
      }
      if (input.filterFullName?.trim()) {
        query.andWhere("member.fullname ILIKE :name", {
          name: `%${input.filterFullName.trim()}%`,
        });
      }
      if (input.filterMosqueId) {
        query.andWhere("member.mosqueId = :mosqueId", {
          mosqueId: input.filterMosqueId,
        });
      }
      if (input.filterStatus) {
        query.andWhere("member.status = :status", { status: input.filterStatus });
      }

      const [rows, total] = await query
        .orderBy("member.createdat", "DESC")
        .skip((input.page - 1) * input.pageSize)
        .take(input.pageSize)
        .getManyAndCount();

      const items = rows.map((m) => ({
        id: m.id,
        fullname: m.fullname,
        icno: m.icno,
        gender: m.gender,
        phoneno: m.phoneno,
        email: m.email,
        address: m.address,
        postcode: m.postcode,
        city: m.city,
        state: m.state,
        maritalstatus: m.maritalstatus,
        spousename: m.spousename,
        spouseicno: m.spouseicno,
        numberofchildren: m.numberofchildren,
        numberofhouseholdmembers: m.numberofhouseholdmembers,
        status: m.status,
        notes: m.notes,
        createdat: m.createdat,
        approvedat: m.approvedat,
        mosque: m.mosque ? { id: m.mosque.id, name: m.mosque.name } : null,
      }));
      return { items, total };
    }),

  approve: staffProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const member = await findPendingInScope(ctx, input.id);
      member.status = QariahMemberStatus.APPROVED;
      member.approvedat = new Date();
      await AppDataSource.getRepository(QariahMember).save(member);

      await AppDataSource.getRepository(KariahDevice).update(
        { icnumber: member.icno },
        { isapproved: true },
      );
      await sendNotificationToKariahDevices({
        icnumber: member.icno,
        notification: {
          title: "Pendaftaran Kariah Diluluskan",
          body: `Pendaftaran anda sebagai ahli kariah ${member.mosque?.name ?? ""} telah diluluskan.`,
        },
      });

      return { success: true };
    }),

  reject: staffProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await findPendingInScope(ctx, input.id);
      member.status = QariahMemberStatus.REJECTED;
      member.notes = input.notes || null;
      await AppDataSource.getRepository(QariahMember).save(member);
      return { success: true };
    }),
});
