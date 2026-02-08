import axios from "axios";
import { getBillplzConfig } from "../config/billplz.config.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.ts";

export async function createBill({
  amount, referenceNo, name, email, phone
}: {
  amount: number; referenceNo: string; name: string; email: string; phone: string;
}) {
  try {
    const config = getBillplzConfig();
    
    console.log("Debug - Callback URL:", config.callbackUrl);

    const payload = {
      collection_id: config.collectionId,
      email: email || 'guest@example.com',
      name: name || 'ANONYMOUS',
      mobile: phone || '60123456789',
      amount: Math.round(Number(amount) * 100), 
      callback_url: config.callbackUrl, 
      redirect_url: config.redirectUrl,
      description: `Tahlil Ref: ${referenceNo}`,
    };

    const auth = Buffer.from(`${config.apiKey}:`).toString("base64");

    const res = await axios.post(`${config.baseUrl}/bills`, payload, {
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json' 
      },
    });

    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Billplz 422 Error Detail:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

export async function handleBillplzCallback(data: any) {
  const { id, amount, paid, state, x_signature } = data;

  const onlineTransactionRepo = AppDataSource.getRepository(OnlineTransaction);
  const onlineTransactionAccountRepo = AppDataSource.getRepository(OnlineTransactionAccount);

  const gatewayStatus = paid === "true" ? "success" : "unsuccessful";

  const transaction = onlineTransactionRepo.create({
    referenceno: id,
    orderno: id,
    orderamount: parseFloat(amount) / 100, // Convert cents back to RM
    gatewaystatus: gatewayStatus,
    billcode: id,
    gatewaymsg: state,
    gatewayhash: x_signature,
  });

  const savedTransaction = await onlineTransactionRepo.save(transaction);

  const transactionAccount = onlineTransactionAccountRepo.create({
    type: 'QR Kubur (Billplz)',
    accountno: 'BILLPLZ_TRANS',
    amount: parseFloat(amount) / 100,
    referenceno: id,
    gatewayStatus: gatewayStatus,
    transaction: savedTransaction, 
  });

  await onlineTransactionAccountRepo.save(transactionAccount);

  return true;
}