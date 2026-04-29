import admin from "firebase-admin";
import { GoogleUserDevice, GoogleUserRecord } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";
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

export const sendPushNotifications = async (
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> => {
  if (!initialized || tokens.length === 0) return;

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification,
      data,
    });

    const failed = response.responses.filter((r) => !r.success);
    if (failed.length > 0) {
      console.warn(`[FCM] ${failed.length}/${tokens.length} messages failed`);
    }
  } catch (e) {
    console.error("[FCM] sendPushNotifications error:", e);
  }
};

export const sendNotificationFCMFromGoogle = async ({
  entityname,
  entityid,
  extraParam
}: {
  entityname: EntityNameGoogleUserRecord,
  entityid: string | number,
  extraParam: any,
}) => {
  try {
    const recordRepo = AppDataSource.getRepository(GoogleUserRecord);
    const deviceRepo = AppDataSource.getRepository(GoogleUserDevice);

    const record = await recordRepo.findOne({
      where: { entityname: entityname, entityid: Number(entityid) },
      relations: ["googleuser"],
    });

    if (record?.googleuser?.id) {
      const devices = await deviceRepo.findBy({
        googleuser: { id: record.googleuser.id },
      });

      const tokens = devices.map((d) => d.fcmToken).filter(Boolean);

      if (tokens.length > 0) {

        if (entityname === "tahlilrequest") {
          const dateStr = extraParam.data.suggesteddate
            ? new Date(extraParam.data.suggesteddate).toLocaleDateString("ms-MY")
            : "-";
  
          await sendPushNotifications(
            tokens,
            {
              title: "Permintaan Tahlil Diterima",
              body: `Permintaan tahlil anda telah diterima. Tarikh yang dicadangkan: ${dateStr}`,
            },
            { requestId: String(extraParam.id) },
          );
        } 
      }
    }
  } catch (error) {
    console.error("[FCM] Failed to notify tahlil requestor:", error);
  }
};
