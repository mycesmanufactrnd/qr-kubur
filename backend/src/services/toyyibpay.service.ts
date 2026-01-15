import axios from "axios";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";

export async function createBill({
  amount,
  referenceNo,
  name,
  email,
  phone,
}: {
  amount: number;
  referenceNo: string;
  name: string;
  email: string;
  phone: string;
}) {
  const toyyibpayConfig = getToyyibpayConfig();

  const payload = {
    userSecretKey: toyyibpayConfig.secretKey,
    categoryCode: toyyibpayConfig.categoryCode,
    billName: "QR Kubur Tahlil",
    billDescription: "Tahlil & Doa Contribution",
    billPriceSetting: 1,
    billPayorInfo: 1,
    billAmount: amount * 100, // RM → cent
    billReturnUrl: toyyibpayConfig.returnUrl,
    billCallbackUrl: toyyibpayConfig.callbackUrl,
    billExternalReferenceNo: referenceNo,
    billTo: name,
    billEmail: email,
    billPhone: phone,
    billPaymentChannel: 0, // FPX
  };

  console.log('payloadpayloadpayloadpayloadpayload', payload)

  const res = await axios.post(
    `${toyyibpayConfig.baseUrl}/index.php/api/createBill`,
    payload
  );

  return res.data[0];
}
