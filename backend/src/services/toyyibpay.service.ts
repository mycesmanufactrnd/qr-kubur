import axios from "axios";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.ts";
import { PLATFORM_FEE } from "../db/enums.ts";

export async function createBill({
  amount,
  referenceNo,
  name,
  email,
  phone,
  returnTo,
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
    let billName = "";
    let billDescription = "";
    let billContentEmail = "";

    if (returnTo === "donation") {
      returnUrl = toyyibpayConfig.returnUrlDonation;

      billName = "Donation Payment";
      billDescription = "Donation contribution";
      billContentEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #1a7a4a; margin-top: 0;">Donation Received</h2>
            <p style="color: #333333; font-size: 15px;">Assalamu'alaikum,</p>
            <p style="color: #333333; font-size: 15px;">Thank you for your generous donation. Your contribution is greatly appreciated and will make a meaningful difference.</p>
            <p style="color: #333333; font-size: 15px;">May Allah bless you and reward you abundantly for your kindness.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #888888; font-size: 12px; margin-bottom: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `;
    } else if (returnTo === "tahfiz") {
      returnUrl = toyyibpayConfig.returnUrlTahlil;

      billName = "Tahlil Contribution";
      billDescription = "Tahlil service contribution";
      billContentEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #1a7a4a; margin-top: 0;">Tahlil Contribution Received</h2>
            <p style="color: #333333; font-size: 15px;">Assalamu'alaikum,</p>
            <p style="color: #333333; font-size: 15px;">Thank you for your Tahlil contribution. Your payment has been received and the Tahlil service will be conducted accordingly.</p>
            <p style="color: #333333; font-size: 15px;">May Allah accept your deeds and shower His mercy upon you and your loved ones.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #888888; font-size: 12px; margin-bottom: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `;
    } else if (returnTo === "organisation") {
      returnUrl = toyyibpayConfig.returnUrlOrganisation;

      billName = "Service Payment";
      billDescription = "Payment for services provided";
      billContentEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #1a7a4a; margin-top: 0;">Payment Confirmed</h2>
            <p style="color: #333333; font-size: 15px;">Assalamu'alaikum,</p>
            <p style="color: #333333; font-size: 15px;">Thank you for your payment. We have received your transaction and the requested services will be processed accordingly.</p>
            <p style="color: #333333; font-size: 15px;">If you have any questions, please contact us.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #888888; font-size: 12px; margin-bottom: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `;
    } else if (returnTo === "deathcharity") {
      returnUrl = toyyibpayConfig.returnUrlDeathCharity;

      billName = "Death Charity Payment";
      billDescription = "Death charity registration and yearly payment";
      billContentEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #1a7a4a; margin-top: 0;">Death Charity Registration Confirmed</h2>
            <p style="color: #333333; font-size: 15px;">Assalamu'alaikum,</p>
            <p style="color: #333333; font-size: 15px;">Thank you for your payment. Your death charity registration and yearly contribution has been successfully received.</p>
            <p style="color: #333333; font-size: 15px;">May Allah ease your affairs and grant barakah in your provision.</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
            <p style="color: #888888; font-size: 12px; margin-bottom: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `;
    }

    // 100 cent to RM1
    const userPayAmount = amount; // RM12 (TOTAL)
    const totalAmount = userPayAmount - PLATFORM_FEE; // RM10
    const finalUserPayAmount = userPayAmount * 100; // 1200

    const payload = {
      userSecretKey: toyyibpayConfig.secretKey,
      categoryCode: toyyibpayConfig.categoryCode,
      billName: billName,
      billDescription: billDescription,
      billPriceSetting: 1, // 0 - for user to set the amount
      billPayorInfo: 1, // 0 - if not require payer info
      billAmount: finalUserPayAmount,
      billReturnUrl: returnUrl,
      billCallbackUrl: toyyibpayConfig.callbackUrl,
      billExternalReferenceNo: referenceNo,
      billTo: name ?? "ANONYMOUS",
      billEmail: email ?? "noreply@gmail.com",
      billPhone: phone ?? "0123456798",
      billPaymentChannel: 0, // Set 0 for FPX, 1 Credit Card and 2 for both FPX & Credit Car
      billContentEmail: billContentEmail,
      billChargeToCustomer: 1, //Set 0 to charge FPX to customer.
      // for split payment
      billSplitPayment: 1,
      billSplitPaymentArgs: JSON.stringify([ { id: "nazzy007", amount: String(Math.round(totalAmount * 100)) } ]),
    };

    const res = await axios.post(
      `${toyyibpayConfig.baseUrl}/index.php/api/createBill`,
      payload,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    if (!Array.isArray(res.data)) {
      const rawMessage = res.data?.msg || "ToyyibPay Error";

      let friendlyMessage = rawMessage;

      if (rawMessage.toLowerCase().includes("billphone")) {
        friendlyMessage = "Please enter a valid phone number.";
      } else if (rawMessage.toLowerCase().includes("billemail")) {
        friendlyMessage = "Please enter a valid email address.";
      } else if (rawMessage.toLowerCase().includes("billname")) {
        friendlyMessage = "Please enter your name.";
      } else if (rawMessage.toLowerCase().includes("amount")) {
        friendlyMessage = "Invalid payment amount.";
      }

      return {
        status: false,
        message: friendlyMessage,
        data: null,
      };
    }

    return {
      status: true,
      message: "Success",
      data: res.data[0],
    };
  } catch (error) {
    console.error("error", error);
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
  };

  const billChargeToCustomer = 0;
  const platformFee = Number(PLATFORM_FEE || 0);
  const gatewayStatus = paymentToyyibStatus[String(status)] || status;
  const orderAmount = Number(amount || 0);
  const originalAmount = Math.max(
    0,
    orderAmount - platformFee - billChargeToCustomer,
  );

  const onlineTransactionRepo = AppDataSource.getRepository(OnlineTransaction);

  const transaction = onlineTransactionRepo.create({
    referenceno: refno,
    orderno: order_id,
    ordertime: transaction_time ? new Date(transaction_time) : null,
    orderamount: Number(orderAmount.toFixed(2)),
    originalamount: Number(originalAmount.toFixed(2)),
    maintenancefee: Number(platformFee.toFixed(2)),
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

  await onlineTransactionRepo.save(transaction);

  return true;
}

export async function upsertTransactionAccountByOrderNo({
  orderNo,
  accountNo,
  bankName,
  type = "QR Kubur",
}: {
  orderNo: string;
  accountNo: string;
  bankName: string;
  type?: string;
}) {
  const onlineTransactionRepo = AppDataSource.getRepository(OnlineTransaction);
  const onlineTransactionAccountRepo = AppDataSource.getRepository(
    OnlineTransactionAccount,
  );

  const transaction = await onlineTransactionRepo.findOne({
    where: { orderno: orderNo },
    order: { createdat: "DESC" },
  });

  if (!transaction) {
    throw new Error(
      "Online transaction not found for the provided order number.",
    );
  }

  const existingAccount = await onlineTransactionAccountRepo.findOne({
    where: { transaction: { id: transaction.id } },
    order: { createdat: "DESC" },
  });

  if (existingAccount) {
    existingAccount.bankname = bankName;
    existingAccount.accountno = accountNo;
    existingAccount.type = type;
    existingAccount.amount = Number(transaction.orderamount || 0);
    return await onlineTransactionAccountRepo.save(existingAccount);
  }

  const transactionAccount = onlineTransactionAccountRepo.create({
    type,
    bankname: bankName,
    accountno: accountNo,
    amount: Number(transaction.orderamount || 0),
    transaction: { id: transaction.id },
  });

  return await onlineTransactionAccountRepo.save(transactionAccount);
}
