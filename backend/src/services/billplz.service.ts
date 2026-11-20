//@ts-nocheck
import axios from "axios";
import crypto from "crypto";
import { getBillplzConfig } from "../config/billplz.config.js";
import { AppDataSource } from "../datasource.js";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.js";
import { DONATION_PLATFORM_FEE, PLATFORM_FEE } from "../db/enums.js";

// Keys match the `returnTo` values the pages send to billplz.createBill.
const BILL_DESCRIPTIONS: Record<string, string> = {
  donation: "Donation contribution",
  tahfiz: "Tahlil service contribution",
  organisation: "Payment for services provided",
  deathcharity: "Death charity registration and yearly payment",
};

export function getBillplzReturnUrl(returnTo: string) {
  const config = getBillplzConfig();
  switch (returnTo) {
    case "donation":
      return config.returnUrlDonation;
    case "tahfiz":
      return config.returnUrlTahlil;
    case "organisation":
      return config.returnUrlOrganisation;
    case "deathcharity":
      return config.returnUrlDeathCharity;
    default:
      return config.returnUrl;
  }
}

function authHeader() {
  const { apiKey } = getBillplzConfig();
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

function toFriendlyMessage(error: any) {
  const raw = error?.response?.data?.error?.message;
  const rawMessage = (Array.isArray(raw) ? raw.join(", ") : raw) || "Billplz Error";
  const lower = String(rawMessage).toLowerCase();

  if (lower.includes("mobile")) return "Please enter a valid phone number.";
  if (lower.includes("email")) return "Please enter a valid email address.";
  if (lower.includes("name")) return "Please enter your name.";
  if (lower.includes("amount")) return "Invalid payment amount.";
  return rawMessage;
}

// Which account paid. Billplz keeps it on the bill as reference_2 ("Users:12",
// "GoogleUser:5") and returns it from GET /bills/:id, so the callback and redirect —
// which have no login of their own — can still fill userid / usertablereference.
export const ACCOUNT_TABLES = ["Users", "GoogleUser"] as const;

function encodeAccountRef(table?: string | null, id?: string | number | null) {
  if (!table || !ACCOUNT_TABLES.includes(table) || id == null || id === "") return null;
  return `${table}:${id}`;
}

function decodeAccountRef(ref?: string | null) {
  const match = /^(Users|GoogleUser):(\d+)$/.exec(String(ref ?? ""));
  return match ? { table: match[1], id: match[2] } : null;
}

export async function createBill({
  amount,
  referenceNo,
  name,
  email,
  phone,
  returnTo,
  userTable,
  userId,
}: {
  amount: number;
  referenceNo: string;
  name: string;
  email: string;
  phone?: string | null;
  returnTo: string;
  userTable?: "Users" | "GoogleUser" | null;
  userId?: string | number | null;
}) {
  const config = getBillplzConfig();
  const redirectTarget = BILL_DESCRIPTIONS[returnTo] ? returnTo : "config";

  const payload: Record<string, any> = {
    collection_id: config.collectionId,
    email,
    name,
    amount: Math.round(Number(amount) * 100),
    callback_url: config.callbackUrl,
    redirect_url: `${config.redirectUrl}/${redirectTarget}`,
    description: BILL_DESCRIPTIONS[returnTo] ?? "QR Kubur payment",
    reference_1_label: "Order No",
    reference_1: referenceNo,
  };
  if (phone) payload.mobile = phone;

  const accountRef = encodeAccountRef(userTable, userId);
  if (accountRef) {
    payload.reference_2_label = "Account";
    payload.reference_2 = accountRef;
  }

  try {
    const res = await axios.post(`${config.baseUrl}/bills`, payload, {
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    });
    return { status: true, message: "Success", data: res.data };
  } catch (error: any) {
    console.error(
      "Billplz createBill error:",
      JSON.stringify(error?.response?.data ?? error?.message),
    );
    return { status: false, message: toFriendlyMessage(error), data: null };
  }
}

export async function getBill(billId: string) {
  const { baseUrl } = getBillplzConfig();
  try {
    const res = await axios.get(`${baseUrl}/bills/${encodeURIComponent(billId)}`, {
      headers: { Authorization: authHeader() },
    });
    return res.data;
  } catch (error: any) {
    console.error(
      "Billplz getBill error:",
      JSON.stringify(error?.response?.data ?? error?.message),
    );
    return null;
  }
}

// Billplz X-Signature: "key+value" strings (minus x_signature), sorted
// case-insensitively by plain code-unit order, joined with "|", HMAC-SHA256 hex.
function computeXSignature(params: Record<string, string>, key: string) {
  const source = Object.entries(params)
    .filter(([k]) => k !== "x_signature")
    .map(([k, v]) => `${k}${v ?? ""}`)
    .sort((a, b) => {
      const x = a.toLowerCase();
      const y = b.toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    })
    .join("|");
  return crypto.createHmac("sha256", key).update(source).digest("hex");
}

export function isValidXSignature(params: Record<string, string>, signature?: string) {
  const { xSignatureKey } = getBillplzConfig();
  if (!xSignatureKey || !signature) return false;
  const expected = Buffer.from(computeXSignature(params, xSignatureKey));
  const given = Buffer.from(String(signature));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Redirect params arrive as `billplz[id]=...`; Billplz signs them as `billplzid...`.
export function parseRedirectQuery(query: Record<string, any>) {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (key === "billplz" && value && typeof value === "object") {
      for (const [inner, v] of Object.entries(value)) flat[inner] = String(v);
      continue;
    }
    const match = /^billplz\[(.+)\]$/.exec(key);
    if (match) flat[match[1]] = String(value);
  }

  const { x_signature, ...rest } = flat;
  const signed = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [`billplz${k}`, v]),
  );

  return {
    billId: flat.id,
    paid: flat.paid === "true",
    transactionId: flat.transaction_id,
    transactionStatus: flat.transaction_status,
    signed,
    signature: x_signature,
  };
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Called from both the callback and the redirect, so it upserts by bill id.
export async function recordBillplzPayment({
  bill,
  transactionId,
  transactionStatus,
  signature,
}: {
  bill: any;
  transactionId?: string;
  transactionStatus?: string;
  signature?: string;
}) {
  const repo = AppDataSource.getRepository(OnlineTransaction);

  const paid = bill.paid === true || bill.paid === "true";
  const orderNo = String(bill.reference_1 || bill.id);
  const isDonation = orderNo.includes("DON-");
  const platformFee = Number(isDonation ? DONATION_PLATFORM_FEE : PLATFORM_FEE) || 0;
  const orderAmount = Number(bill.amount || 0) / 100;
  const originalAmount = Math.max(0, orderAmount - platformFee);
  const paidAt = parseDate(bill.paid_at);
  const account = decodeAccountRef(bill.reference_2);

  const existing = await repo.findOne({
    where: { billcode: bill.id },
    order: { createdat: "DESC" },
  });

  // A late "unpaid" redirect must never downgrade a confirmed payment.
  if (existing?.gatewaystatus === "success" && !paid) return existing;

  const transaction = repo.merge(existing ?? repo.create(), {
    referenceno: transactionId || existing?.referenceno || bill.id,
    orderno: orderNo,
    ordertime: paidAt ?? existing?.ordertime ?? null,
    orderamount: Number(orderAmount.toFixed(2)),
    originalamount: Number(originalAmount.toFixed(2)),
    maintenancefee: Number(platformFee.toFixed(2)),
    orderstatus: paid ? "1" : "3",
    transactionid: transactionId || existing?.transactionid || null,
    userid: account?.id ?? existing?.userid ?? null,
    usertablereference: account?.table ?? existing?.usertablereference ?? null,
    fpxtransactiontime: paidAt ?? existing?.fpxtransactiontime ?? null,
    billcode: bill.id,
    gatewaymsg: bill.state,
    gatewayadditionalmsg: transactionStatus || existing?.gatewayadditionalmsg || null,
    gatewaystatus: paid ? "success" : "unsuccessful",
    gatewayhash: signature || existing?.gatewayhash || null,
  });

  return await repo.save(transaction);
}

// Payer's bank account for manual payout, attached to the latest transaction of an order.
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
