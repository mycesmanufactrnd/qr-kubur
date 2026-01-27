export const getBucketConfig = () => ({
  tahfizPaymentConfBucketId: process.env.TAHFIZ_PAYMENT_CONFIG_STORAGE_ID!,
  organisatinPaymentConfBucketId: process.env.ORGANISATION_PAYMENT_CONFIG_STORAGE_ID!,
  graveBucketId: process.env.GRAVE_STORAGE_ID!,
  tahlilRequestBucketId: process.env.TAHLIL_REQUEST_STORAGE_ID!,
});
