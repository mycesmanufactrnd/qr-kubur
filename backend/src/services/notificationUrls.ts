//@ts-nocheck
/**
 * Single source of truth for "which frontend page should a push notification
 * open when the user taps it" — keyed by the same `event` string each
 * sendNotificationFCM* function already tags its notifications with.
 *
 * Without this, the web SW / native tap handler falls back to "/" whenever a
 * notification's data payload has no `url`, which is what was happening for
 * every event except the tahlil-to-requestor ones.
 */

type UrlParams = Record<string, string | number | null | undefined>;

const withQuery = (path: string, params?: UrlParams) => {
  if (!params) return path;
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return query ? `${path}?${query}` : path;
};

const NOTIFICATION_EVENT_URLS: Record<string, (params: UrlParams) => string> = {
  // sendNotificationFCMToUser (entityname: "tahlilrequest") — to the requestor
  livetahlil: ({ referenceno }) => withQuery("/CheckTahlilStatus", { ref: referenceno }),
  tahlilrequest: ({ referenceno }) => withQuery("/CheckTahlilStatus", { ref: referenceno }),

  // sendNotificationFCMToTahfiz — to tahfiz center admins
  tahlilrequest_created: () => "/ManageTahlilRequests",

  // sendNotificationFCMToOrganisation — to organisation admins/employees
  quotation_created: () => "/ManageQuotations",
  kariah_registered: () => "/ManageKariahMember",
  jenazahcase_created: () => "/ManageJenazahCase",
  jenazahcase_approved: () => "/ManageJenazahCase",
  jenazahcase_pending_reminder: () => "/ManageJenazahCase",

  // sendNotificationToKariahDevices — to the registering kariah member (by icnumber)
  kariahRegistrationStatus: () => "/UserKariahRegistration",
};

/** Falls back to "/" for an unrecognized event, same as the old (missing-url) behavior. */
export const buildNotificationUrl = (
  event: string,
  params: UrlParams = {},
): string => {
  const builder = NOTIFICATION_EVENT_URLS[event];
  return builder ? builder(params) : "/";
};
