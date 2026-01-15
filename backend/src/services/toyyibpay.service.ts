import axios from "axios";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";
import { supabaseClient } from "../supabase.ts";

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
    billAmount: amount * 100,
    billReturnUrl: toyyibpayConfig.returnUrl,
    billCallbackUrl: toyyibpayConfig.callbackUrl,
    billExternalReferenceNo: referenceNo,
    billTo: name,
    billEmail: email,
    billPhone: phone,
    billPaymentChannel: 0,
  };

  const res = await axios.post(
    `${toyyibpayConfig.baseUrl}/index.php/api/createBill`,
    payload,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return res.data[0];
}

export async function handleToyyibPayCallback(data: any) {
  const {
    refno,
    status,
    reason,
    billcode,
    order_id,
    amount,
    transaction_time,
  } = data;

  console.log("ToyyibPay callback received:", data);

  // const { error } = await supabaseClient
  //   .from("payments")
  //   .update({
  //     status,
  //     reason,
  //     amount,
  //     transaction_time,
  //   })
  //   .eq("billcode", billcode);

  // if (error) {
  //   console.error("Failed to update payment:", error);
  //   throw new Error("DB update failed");
  // }

  return true;
};