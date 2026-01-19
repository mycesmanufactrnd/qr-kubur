export const getBillplzConfig = () => ({
  // Sandbox URL: https://www.billplz-sandbox.com/api/v3/
  baseUrl: process.env.BILLPLZ_BASE_URL || "https://www.billplz-sandbox.com/api/v3",
  apiKey: process.env.BILLPLZ_API_KEY!,
  collectionId: process.env.BILLPLZ_COLLECTION_ID!,
  xSignatureKey: process.env.BILLPLZ_X_SIGNATURE_KEY!,
  callbackUrl: process.env.BILLPLZ_CALLBACK_URL!,
  redirectUrl: process.env.BILLPLZ_REDIRECT_URL!,
});