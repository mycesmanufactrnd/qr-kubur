import admin from "firebase-admin";
import { GoogleUserDevice, GoogleUserRecord } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";
import { TahlilStatus } from "../db/enums.ts";
import type { EntityNameGoogleUserRecord } from "../db/enums.ts";

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
export const sendPushNotifications = async (
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<string[]> => {
  if (!initialized || tokens.length === 0) return [];

  const staleTokens: string[] = [];

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification,
      data,
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

    const record = await recordRepo.findOne({
      where: { entityname: entityname, entityid: Number(entityid) },
      relations: ["googleuser"],
    });

    if (!record?.googleuser?.id) return;

    const referenceno = record.referenceno ?? "";

    const devices = await deviceRepo.findBy({
      googleuser: { id: record.googleuser.id },
    });

    const tokens = devices.map((d) => d.fcmToken).filter(Boolean);
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

        if (status === TahlilStatus.REJECTED) {
          title = "Permintaan Tahlil Ditolak";
          body = "Maaf, permintaan tahlil anda telah ditolak.";
        } else {
          const dateStr = inputData.data?.suggesteddate
            ? new Date(inputData.data.suggesteddate).toLocaleDateString(
                "ms-MY",
              )
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
