//@ts-nocheck
import admin from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { In } from "typeorm";
import {
  GoogleUserDevice,
  GoogleUserRecord,
  User,
  UserDevice,
} from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { TahlilStatus } from "../db/enums.js";
import type { EntityNameGoogleUserRecord } from "../db/enums.js";

let initialized = false;

const safePrintServiceAccount = (sa: any) => {
  console.log("\n🔥 Firebase Service Account (Safe View)");

  const print = (label: string, value: any, mask = false) => {
    if (!value) {
      console.log(`❌ ${label}: MISSING`);
      return;
    }

    if (mask) {
      console.log(`🔒 ${label}: ************`);
    } else {
      console.log(`✅ ${label}: ${value}`);
    }
  };

  print("Type", sa.type);
  print("Project ID", sa.project_id);
  print("Private Key ID", sa.private_key_id, true);
  print("Private Key", sa.private_key, true);
  print("Client Email", sa.client_email);
  print("Client ID", sa.client_id);
  print("Auth URI", sa.auth_uri);
  print("Token URI", sa.token_uri);
  print("Auth Provider Cert URL", sa.auth_provider_x509_cert_url);
  print("Client Cert URL", sa.client_x509_cert_url);
  print("Universe Domain", sa.universe_domain);
};

const initFirebase = () => {
  if (initialized || admin.apps.length > 0) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT not set");
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);

    safePrintServiceAccount(serviceAccount);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
  } catch (e) {
    console.error("[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
  }
};

initFirebase();

const STALE_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

/**
 * Sends push notifications and returns the list of tokens that are stale
 * (expired/unregistered) so the caller can remove them from the DB.
 */
export const verifyFirebaseIdToken = async (
  idToken: string,
): Promise<DecodedIdToken> => {
  if (!initialized || admin.apps.length === 0) {
    throw new Error("Firebase not initialized");
  }
  return admin.auth().verifyIdToken(idToken);
};

export const sendPushNotifications = async (
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<string[]> => {
  if (!initialized || tokens.length === 0) return [];

  const staleTokens: string[] = [];

  try {
    // Send as data-only — no top-level `notification` field.
    // With a `notification` field, FCM shows it automatically AND onBackgroundMessage
    // also fires, causing duplicate notifications. Data-only lets the SW be the
    // single display controller for both foreground and background.
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      data: {
        title: notification.title,
        body: notification.body,
        ...data,
      },
      webpush: { fcmOptions: {} },
    });

    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        console.warn(`[FCM] Token[${i}] failed:`, code, r.error?.message);
        const token = tokens[i];
        if (code && token && STALE_TOKEN_CODES.has(code)) {
          staleTokens.push(token);
        }
      }
    });

    if (response.successCount > 0) {
      console.log(
        `[FCM] ${response.successCount}/${tokens.length} sent successfully`,
      );
    }
  } catch (e) {
    console.error("[FCM] sendPushNotifications error:", e);
  }

  return staleTokens;
};

export const sendNotificationFCMFromGoogle = async ({
  entityname,
  entityid,
  extraParam,
}: {
  entityname: EntityNameGoogleUserRecord;
  entityid: string | number;
  extraParam: {
    event: string;
    [key: string]: any;
  };
}) => {
  try {
    const recordRepo = AppDataSource.getRepository(GoogleUserRecord);
    const deviceRepo = AppDataSource.getRepository(GoogleUserDevice);

    console.log(
      `[FCM→Google] Looking up record: entityname=${entityname}, entityid=${entityid}`,
    );

    const record = await recordRepo.findOne({
      where: { entityname: entityname, entityid: Number(entityid) },
      relations: ["googleuser"],
    });

    if (!record?.googleuser?.id) {
      console.warn(
        `[FCM→Google] No GoogleUserRecord found for ${entityname}#${entityid}`,
      );
      return;
    }

    console.log(`[FCM→Google] Found GoogleUser id=${record.googleuser.id}`);

    const referenceno = record.referenceno ?? "";

    const devices = await deviceRepo.findBy({
      googleuser: { id: record.googleuser.id },
    });

    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);
    console.log(
      `[FCM→Google] Found ${tokens.length} device token(s) for googleUser#${record.googleuser.id}`,
    );
    if (tokens.length === 0) return;

    let staleTokens: string[] = [];

    const { event, inputData } = extraParam;

    if (entityname === "tahlilrequest") {
      const refUrl = referenceno
        ? `/CheckTahlilStatus?ref=${encodeURIComponent(referenceno)}`
        : "/CheckTahlilStatus";

      let title: string = "";
      let body: string = "";

      if (event === "livetahlil") {
        title = `Tahlil Langsung Bermula${referenceno ? ` - ${referenceno}` : ""}`;
        body =
          "Sesi tahlil langsung untuk permohonan anda telah bermula. Sertai sekarang!";
      }

      if (event === "tahlilrequest") {
        const status = inputData.data?.status;

        if (status === TahlilStatus.ACCEPTED) {
          const dateStr = inputData.data?.suggesteddate
            ? new Date(inputData.data.suggesteddate).toLocaleDateString("ms-MY")
            : "-";
          title = `Permintaan Tahlil Diterima${referenceno ? ` - ${referenceno}` : ""}`;
          body = `Permintaan tahlil anda telah diterima. Tarikh yang dicadangkan: ${dateStr}`;
        }
      }

      staleTokens = await sendPushNotifications(
        tokens,
        { title, body },
        { requestId: String(inputData.id ?? ""), url: refUrl },
      );
    }

    // removing stale token
    if (staleTokens.length > 0) {
      await deviceRepo.delete(staleTokens.map((t) => ({ fcmToken: t })) as any);
      console.log(`[FCM] Removed ${staleTokens.length} stale token(s) from DB`);
    }
  } catch (error) {
    console.error("[FCM] Failed to notify tahlil requestor:", error);
  }
};

export const sendNotificationFCMToTahfiz = async ({
  tahfizId,
  event,
  inputData,
}: {
  tahfizId: number;
  event: string;
  inputData: Record<string, any>;
}): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const deviceRepo = AppDataSource.getRepository(UserDevice);

    const tahfizUsers = await userRepo.find({
      where: { tahfizcenter: { id: tahfizId } },
      select: ["id"],
    });
    if (tahfizUsers.length === 0) return;

    const devices = await deviceRepo.find({
      where: { user: { id: In(tahfizUsers.map((u) => u.id)) } },
    });

    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    let title = "";
    let body = "";

    if (event === "tahlilrequest_created") {
      const requestor = inputData.requestorname ?? "Seseorang";
      title = "Permohonan Tahlil Baru";
      body = `${requestor} telah membuat permohonan tahlil baru. Sila semak dan luluskan.`;
    }

    if (!title) return;

    const staleTokens = await sendPushNotifications(
      tokens,
      { title, body },
      {
        tahfizId: String(tahfizId),
        event,
      },
    );

    if (staleTokens.length > 0) {
      await deviceRepo.delete(staleTokens.map((t) => ({ fcmToken: t })) as any);
      console.log(`[FCM] Removed ${staleTokens.length} stale token(s) from DB`);
    }
  } catch (error) {
    console.error("[FCM] Failed to notify tahfiz admin:", error);
  }
};

export const sendNotificationFCMToOrganisation = async ({
  organisationId,
  event,
  inputData,
}: {
  organisationId: number;
  event: string;
  inputData: Record<string, any>;
}): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const deviceRepo = AppDataSource.getRepository(UserDevice);

    const orgUsers = await userRepo.find({
      where: { organisation: { id: organisationId } },
      select: ["id"],
    });
    if (orgUsers.length === 0) return;

    const devices = await deviceRepo.find({
      where: { user: { id: In(orgUsers.map((u) => u.id)) } },
    });

    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    let title = "";
    let body = "";

    if (event === "quotation_created") {
      const services = (
        (inputData.selectedservices as { service: string }[]) ?? []
      )
        .map((s) => s.service)
        .join(", ");
      title = "Perkhidmatan Baru Dipesan";
      body = services
        ? `Permohonan perkhidmatan baru telah diterima: ${services}`
        : "Permohonan perkhidmatan baru telah diterima.";
    }

    if (!title) return;

    const staleTokens = await sendPushNotifications(
      tokens,
      { title, body },
      {
        organisationId: String(organisationId),
        event,
      },
    );

    if (staleTokens.length > 0) {
      await deviceRepo.delete(staleTokens.map((t) => ({ fcmToken: t })) as any);
      console.log(`[FCM] Removed ${staleTokens.length} stale token(s) from DB`);
    }
  } catch (error) {
    console.error("[FCM] Failed to notify organisation:", error);
  }
};
