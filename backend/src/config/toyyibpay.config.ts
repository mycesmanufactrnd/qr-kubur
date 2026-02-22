export const getToyyibpayConfig = () => ({
  baseUrl: process.env.DEV_TOYYIBPAY_BASE_URL!,
  secretKey: process.env.DEV_TOYYIBPAY_SECRET_KEY!,
  categoryCode: process.env.DEV_TOYYIBPAY_REGISTRATION_CATEGORY_CODE!,
  callbackUrl: process.env.DEV_TOYYIBPAY_CALLBACK_URL!,
  returnUrl: process.env.DEV_TOYYIBPAY_RETURN_URL!,
  returnUrlDonation: process.env.DEV_TOYYIBPAY_RETURN_URL_DONATION!,
  returnUrlOrganisation: process.env.DEV_TOYYIBPAY_RETURN_URL_ORGANISATION!,
  returnUrlTahlil: process.env.DEV_TOYYIBPAY_RETURN_URL_TAHLIL!,
  returnUrlDeathCharity: process.env.DEV_TOYYIBPAY_RETURN_URL_DEATH_CHARITY!,
});
