import axios from "axios";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.ts";
import { SERVICE_FEE } from "../db/enums.ts";

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
    let billName = '';
    let billDescription = '';
    let billContentEmail = '';
    
    if (returnTo === "donation") {
      returnUrl = toyyibpayConfig.returnUrlDonation;

      billName = "Donation Payment";
      billDescription = "Donation contribution";
      billContentEmail = "Thank you for your donation. Your contribution is greatly appreciated.";

    } else if (returnTo === "tahfiz") {
      returnUrl = toyyibpayConfig.returnUrlTahlil;

      billName = "Tahlil Contribution";
      billDescription = "Tahlil service contribution";
      billContentEmail = "Thank you for your Tahlil contribution. May your kindness be rewarded.";

    } else if (returnTo === "organisation") {
      returnUrl = toyyibpayConfig.returnUrlOrganisation;

      billName = "Service Payment";
      billDescription = "Payment for services provided";
      billContentEmail = "Thank you for your payment. The requested services will be processed accordingly.";
    } else if (returnTo === "deathcharity") {
      returnUrl = toyyibpayConfig.returnUrlDeathCharity;

      billName = "Death Charity Payment";
      billDescription = "Death charity registration and yearly payment";
      billContentEmail = "Thank you for your payment. Your death charity payment has been received.";
    }
    
    // 100 cent to RM1
    const finalAmount = amount * 100; 

    const payload = {
      userSecretKey: toyyibpayConfig.secretKey,
      categoryCode: toyyibpayConfig.categoryCode,
      billName: billName,
      billDescription: billDescription,
      billPriceSetting: 1, // 0 - for user to set the amount
      billPayorInfo: 1, // 0 - if not require payer info
      billAmount: finalAmount,
      billReturnUrl: returnUrl,
      billCallbackUrl: toyyibpayConfig.callbackUrl,
      billExternalReferenceNo: referenceNo,
      billTo: name ?? 'ANONYMOUS',
      billEmail: email ?? 'noreply@gmail.com',
      billPhone: phone ?? '0123456798',
      billPaymentChannel: 0, // Set 0 for FPX, 1 Credit Card and 2 for both FPX & Credit Car
      billContentEmail: billContentEmail,
      billChargeToCustomer: 1, //Set 0 to charge FPX to customer.
    };

    
    const res = await axios.post(
      `${toyyibpayConfig.baseUrl}/index.php/api/createBill`,
      payload,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!Array.isArray(res.data)) {
      const rawMessage = res.data?.msg || 'ToyyibPay Error';

      let friendlyMessage = rawMessage;

      if (rawMessage.toLowerCase().includes('billphone')) {
        friendlyMessage = 'Please enter a valid phone number.';
      } 
      else if (rawMessage.toLowerCase().includes('billemail')) {
        friendlyMessage = 'Please enter a valid email address.';
      } 
      else if (rawMessage.toLowerCase().includes('billname')) {
        friendlyMessage = 'Please enter your name.';
      } 
      else if (rawMessage.toLowerCase().includes('amount')) {
        friendlyMessage = 'Invalid payment amount.';
      }

      return {
        status: false,
        message: friendlyMessage,
        data: null,
      };
    }

    return {
      status: true,
      message: 'Success',
      data: res.data[0],
    };
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

  const billChargeToCustomer = 0;
  const serviceFee = Number(SERVICE_FEE || 0);
  const gatewayStatus = paymentToyyibStatus[String(status)] || status;
  const orderAmount = Number(amount || 0);
  const originalAmount = Math.max(0, orderAmount - serviceFee - billChargeToCustomer);

  const onlineTransactionRepo = AppDataSource.getRepository(OnlineTransaction);
  const onlineTransactionAccountRepo = AppDataSource.getRepository(OnlineTransactionAccount);

  const transaction = onlineTransactionRepo.create({
    referenceno: refno,
    orderno: order_id,
    ordertime: transaction_time ? new Date(transaction_time) : null,
    orderamount: Number(orderAmount.toFixed(2)),
    originalamount: Number(originalAmount.toFixed(2)),
    maintenancefee: Number(serviceFee.toFixed(2)),
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
    amount: Number(orderAmount.toFixed(2)),
    transaction: savedTransaction, 
  });

  await onlineTransactionAccountRepo.save(transactionAccount);

  return true
}
