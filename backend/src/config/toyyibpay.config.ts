const prefix = process.env.NODE_ENV === 'production' ? 'LIVE' : 'DEV';

const get = (key: string) => {
  const value = process.env[`${prefix}_${key}`];
  if (!value) {
    throw new Error(`Missing env: ${prefix}_${key}`);
  }
  return value;
};

export const getToyyibpayConfig = () => ({
  baseUrl: get('TOYYIBPAY_BASE_URL'),
  secretKey: get('TOYYIBPAY_SECRET_KEY'),
  categoryCode: get('TOYYIBPAY_REGISTRATION_CATEGORY_CODE'),
  callbackUrl: get('TOYYIBPAY_CALLBACK_URL'),
  returnUrl: get('TOYYIBPAY_RETURN_URL'),
  returnUrlDonation: get('TOYYIBPAY_RETURN_URL_DONATION'),
  returnUrlOrganisation: get('TOYYIBPAY_RETURN_URL_ORGANISATION'),
  returnUrlTahlil: get('TOYYIBPAY_RETURN_URL_TAHLIL'),
  returnUrlDeathCharity: get('TOYYIBPAY_RETURN_URL_DEATH_CHARITY'),
});