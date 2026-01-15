export const getToyyibpayConfig = () => ({
  baseUrl: process.env.DEV_TOYYIBPAY_BASE_URL!,
  secretKey: process.env.DEV_TOYYIBPAY_SECRET_KEY!,
  categoryCode: process.env.DEV_TOYYIBPAY_REGISTRATION_CATEGORY_CODE!,
  returnUrl: process.env.DEV_TOYYIBPAY_RETURN_URL!,
  callbackUrl: process.env.DEV_TOYYIBPAY_CALLBACK_URL!,
});
