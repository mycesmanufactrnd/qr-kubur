// /api/upload/
// resolveFileUrl

export const getBucketConfig = () => ({
  // Payment configs
  tahfizPaymentConfBucketId: process.env.TAHFIZ_PAYMENT_CONFIG_STORAGE_ID!,
  organisationPaymentConfBucketId: process.env.ORGANISATION_PAYMENT_CONFIG_STORAGE_ID!,
  onlineTransactionBucketId: process.env.ONLINE_TRANSACTION_STORAGE_ID!,

  // Graves
  graveBucketId: process.env.GRAVE_STORAGE_ID!,
  graveServiceQuotationBucketId: process.env.GRAVE_SERVICE_QUOTATION_STORAGE_ID!,

  // Tahlil / Tahfiz
  tahlilRequestBucketId: process.env.TAHLIL_REQUEST_STORAGE_ID!,
  tahfizCenterBucketId: process.env.TAHFIZ_CENTER_STORAGE_ID!,

  // Heritage & Waqf
  heritageSiteBucketId: process.env.HERITAGE_SITE_STORAGE_ID!,
  waqfProjectBucketId: process.env.WAQF_PROJECT_STORAGE_ID!,

  // Mosque
  mosqueBucketId: process.env.MOSQUE_STORAGE_ID!,

  // Organisation
  organisationBucketId: process.env.ORGANISATION_STORAGE_ID!,
  organisationServicesProofBucketId: process.env.ORGANISATION_SERVICES_PROOF_STORAGE_ID!,

  // Activity & People
  activityPostBucketId: process.env.ACTIVITY_POST_STORAGE_ID!,
  deadPersonBucketId: process.env.DEAD_PERSON_STORAGE_ID!,
  deathConfirmationBucketId: process.env.DEATH_CONFIRMATION_STORAGE_ID,
  policeReportBucketId: process.env.POLICE_REPORT_STORAGE_ID,
  supportingDocJenazahCaseBucketId: process.env.SUPPORTING_DOC_JENAZAH_CASE_STORAGE_ID,
});
