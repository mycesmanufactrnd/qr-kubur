import axios from "axios";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.ts";

export async function createBill({
  amount,
  referenceNo,
  name,
  email,
  phone,
  returnTo
}: {
  amount: number;
  referenceNo?: string;
  name?: string;
  email?: string;
  phone?: string;
  returnTo: string;
}) {
  try {
    const toyyibpayConfig = getToyyibpayConfig();

    let returnUrl = toyyibpayConfig.returnUrl;
    
    if (returnTo === "donation") {
      returnUrl = toyyibpayConfig.returnUrlDonation;
    }
    else if (returnTo === 'tahfiz') {
      returnUrl = toyyibpayConfig.returnUrlTahlil;
    }

    const payload = {
      userSecretKey: toyyibpayConfig.secretKey,
      categoryCode: toyyibpayConfig.categoryCode,
      billName: "QR Kubur Tahlil",
      billDescription: "Tahlil & Doa Contribution",
      billPriceSetting: 1, // 0 - for user to set the amount
      billPayorInfo: 1, // 0 - if not require payer info
      billAmount: amount * 10,
      billReturnUrl: returnUrl,
      billCallbackUrl: toyyibpayConfig.callbackUrl,
      billExternalReferenceNo: referenceNo,
      billTo: name ?? 'ANONYMOUS',
      billEmail: email ?? 'noreply@gmail.com',
      billPhone: phone ?? '0123456798',
      billPaymentChannel: 0, // Set 0 for FPX, 1 Credit Card and 2 for both FPX & Credit Car
      billContentEmail: 'Meow, Thank you for purchasing our product!',
      billChargeToCustomer: 0, //Set 0 to charge FPX to customer.
    };

    const res = await axios.post(
      `${toyyibpayConfig.baseUrl}/index.php/api/createBill`,
      payload,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
  
    return res.data[0];
  } catch (error) {
    console.error('error', error)
  }
}

export async function handleToyyibPayCallback(data: any) {
  const {
    refno,
    status,
    reason,
    billcode,
    order_id,
    amount,
    status_id,
    msg,
    transaction_id,
    fpx_transaction_id,
    hash,
    transaction_time,
  } = data;

  const paymentToyyibStatus: Record<string, string> = {
    "1": "success",
    "2": "pending",
    "3": "unsuccessful",
    
    "01": "success",
    "02": "pending",
    "03": "unsuccessful",
  }

  const gatewayStatus = paymentToyyibStatus[String(status)] || status;

  const onlineTransactionRepo = AppDataSource.getRepository(OnlineTransaction);
  const onlineTransactionAccountRepo = AppDataSource.getRepository(OnlineTransactionAccount);

  const transaction = onlineTransactionRepo.create({
    referenceno: refno,
    orderno: order_id,
    ordertime: transaction_time ? new Date(transaction_time) : null,
    orderamount: parseFloat(amount),
    orderstatus: status_id,
    transactionid: transaction_id,
    userid: null,
    fpxdirectrespcode: null,
    fpxindirectrespcode: null,
    fpxtransactionid: fpx_transaction_id,
    fpxtransactiontime: transaction_time ? new Date(transaction_time) : null,
    billcode: billcode,
    gatewaymsg: msg,
    gatewayadditionalmsg: reason,
    gatewaystatus: gatewayStatus,
    gatewayhash: hash,
  });

  const savedTransaction = await onlineTransactionRepo.save(transaction);

  const transactionAccount = onlineTransactionAccountRepo.create({
    type: 'QR Kubur',
    accountno: '123456789',
    amount: parseFloat(amount),
    transaction: savedTransaction, 
  });

  await onlineTransactionAccountRepo.save(transactionAccount);

  return true
}