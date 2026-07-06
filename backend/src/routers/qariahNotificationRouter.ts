// @ts-nocheck
import z from "zod";
import { In } from "typeorm";
import { protectedProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import {
  DeathCharityMember,
  Organisation,
  QariahDeathNotification,
  QariahDevice,
} from "../db/entities.js";
import { sendPushNotifications } from "../services/firebase.service.js";

const DEFAULT_TEMPLATE =
  "Innalillahi wainna ilaihi rajiun. Dengan penuh dukacita kami memaklumkan bahawa ahli qariah kita, {name}, telah kembali ke rahmatullah. Semoga Allah mencucuri rahmat ke atas rohnya dan ditempatkan dalam kalangan orang-orang yang soleh. Al-Fatihah.";

function buildMessage(
  template: string,
  name: string,
  address?: string | null,
): string {
  return template
    .replace(/{name}/g, name || "")
    .replace(/{address}/g, address || "");
}

async function doSendNotification(
  organisationId: number,
  mosqueId: number | null | undefined,
  excludeMemberId: number | null | undefined,
  message: string,
): Promise<number> {
  const memberRepo = AppDataSource.getRepository(DeathCharityMember);
  const deviceRepo = AppDataSource.getRepository(QariahDevice);

  const qariahMembers = await memberRepo.find({
    where: {
      organisation: { id: organisationId },
      isapproved: true,
      ...(mosqueId ? { mosqueId } : {}),
    },
    select: ["id", "icnumber"],
  });

  const icnumbers = qariahMembers
    .filter((m) => m.id !== excludeMemberId)
    .map((m) => m.icnumber);

  if (icnumbers.length === 0) return 0;

  const devices = await deviceRepo.find({
    where: { icnumber: In(icnumbers), isapproved: true },
  });

  const tokens = devices.map((d) => d.fcmQariahToken).filter(Boolean);
  if (tokens.length === 0) return 0;

  const staleTokens = await sendPushNotifications(
    tokens,
    { title: "Takziah — Kematian Ahli Qariah", body: message },
    { organisationId: String(organisationId), event: "qariahDeath" },
  );

  if (staleTokens.length > 0) {
    await deviceRepo.delete(
      staleTokens.map((t) => ({ fcmQariahToken: t })) as any,
    );
  }

  return tokens.length - staleTokens.length;
}

export const qariahNotificationRouter = router({
  getPagedNotifications: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(20),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize } = input;
      const repo = AppDataSource.getRepository(QariahDeathNotification);
      const [items, total] = await repo
        .createQueryBuilder("n")
        .leftJoinAndSelect("n.deceasedMember", "member")
        .leftJoinAndSelect("n.organisation", "organisation")
        .orderBy("n.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();
      return { items, total };
    }),

  notifyDeath: protectedProcedure
    .input(
      z.object({
        deceasedMemberId: z.number(),
        customMessage: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { deceasedMemberId, customMessage } = input;

      const memberRepo = AppDataSource.getRepository(DeathCharityMember);
      const notifRepo = AppDataSource.getRepository(QariahDeathNotification);

      const deceased = await memberRepo.findOne({
        where: { id: deceasedMemberId },
        relations: ["organisation"],
      });

      if (!deceased?.organisation) {
        throw new Error(
          "Ahli qariah atau organisasi tidak dijumpai.",
        );
      }

      const template =
        customMessage?.trim() ||
        deceased.organisation.deathnotificationtemplate ||
        DEFAULT_TEMPLATE;

      const message = buildMessage(template, deceased.fullname, deceased.address);

      const notifiedcount = await doSendNotification(
        deceased.organisation.id,
        deceased.mosqueId ?? deceased.mosque?.id ?? null,
        deceasedMemberId,
        message,
      );

      const notif = notifRepo.create({
        deceasedMember: { id: deceasedMemberId },
        organisation: { id: deceased.organisation.id },
        message,
        notifiedcount,
      });
      await notifRepo.save(notif);

      return { notifiedcount, message };
    }),

  resendNotification: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: notificationId }) => {
      const notifRepo = AppDataSource.getRepository(QariahDeathNotification);

      const notif = await notifRepo.findOne({
        where: { id: notificationId },
        relations: ["deceasedMember", "organisation"],
      });
      if (!notif) throw new Error("Notifikasi tidak dijumpai.");

      const organisationId = notif.organisation?.id;
      const deceasedId = notif.deceasedMember?.id;
      if (!organisationId) throw new Error("Organisasi tidak dijumpai.");

      const notifiedcount = await doSendNotification(
        organisationId,
        notif.deceasedMember?.mosqueId ?? notif.deceasedMember?.mosque?.id ?? null,
        deceasedId,
        notif.message,
      );

      notif.notifiedcount = notifiedcount;
      await notifRepo.save(notif);

      return { notifiedcount };
    }),

  deleteNotification: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: id }) => {
      const repo = AppDataSource.getRepository(QariahDeathNotification);
      return await repo.delete(id);
    }),

  getOrganisationTemplate: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      const organisation = await repo.findOne({
        where: { id: input.organisationId },
        select: ["id", "name", "deathnotificationtemplate"],
      });
      return { organisation, defaultTemplate: DEFAULT_TEMPLATE };
    }),

  saveOrganisationTemplate: protectedProcedure
    .input(
      z.object({
        organisationId: z.number(),
        template: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      await repo.update(input.organisationId, {
        deathnotificationtemplate: input.template?.trim() || null,
      });
      return { success: true };
    }),
});
