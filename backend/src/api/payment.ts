import type { FastifyInstance } from "fastify";
import { handleToyyibPayCallback } from "../services/toyyibpay.service.js";
import {
  getBill,
  getBillplzReturnUrl,
  isValidXSignature,
  parseRedirectQuery,
  recordBillplzPayment,
} from "../services/billplz.service.js";

export const registerPaymentRoutes = (app: FastifyInstance) => {
  app.post("/api/payment/callback", async (req, reply) => {

    const data: Record<string, string> = {};

    if (req.isMultipart && req.isMultipart()) {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === "field") {
          data[part.fieldname] = String(part.value);
        }
      }
    } else if (req.body && typeof req.body === "object") {
      for (const [key, value] of Object.entries(
        req.body as Record<string, any>,
      )) {
        data[key] = String(value);
      }
    } else if (typeof req.body === "string") {
      const params = new URLSearchParams(req.body);
      for (const [key, value] of params.entries()) {
        data[key] = value;
      }
    }

    // console.log("ToyyibPay callback parsed:", data);

    try {
      const callbackRes = await handleToyyibPayCallback(data);

      if(!callbackRes) {
        console.error("ToyyibPay callback error");
      }

      return reply.send("OK");
    } catch (err: any) {
      console.error("ToyyibPay callback error:", err);
      return reply.status(500).send("Error");
    }
  });

  // Billplz server-to-server notification (application/x-www-form-urlencoded).
  app.post("/api/payment/billplz/callback", async (req, reply) => {
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      (req.body ?? {}) as Record<string, any>,
    )) {
      data[key] = String(value ?? "");
    }

    const billId = data.id;
    if (!billId || !isValidXSignature(data, data.x_signature)) {
      console.error("Billplz callback rejected: invalid x_signature", billId);
      return reply.status(401).send("Invalid signature");
    }

    try {
      const bill = await getBill(billId);
      // Non-200 makes Billplz retry the callback later.
      if (!bill) return reply.status(502).send("Error");

      await recordBillplzPayment({
        bill,
        transactionId: data.transaction_id,
        transactionStatus: data.transaction_status,
        signature: data.x_signature,
      });

      return reply.send("OK");
    } catch (err: any) {
      console.error("Billplz callback error:", err);
      return reply.status(500).send("Error");
    }
  });

  // Billplz sends the payer's browser here; we verify it and forward to the
  // page in the same `?status_id=&order_id=&billcode=` shape ToyyibPay used.
  app.get<{ Params: { returnTo: string } }>(
    "/api/payment/billplz/redirect/:returnTo",
    async (req, reply) => {
      const returnUrl = getBillplzReturnUrl(req.params.returnTo);
      if (!returnUrl) return reply.status(500).send("Return URL not configured");

      const target = new URL(returnUrl);
      const redirect = parseRedirectQuery(req.query as Record<string, any>);
      const billId = redirect.billId;

      let paid = false;
      if (billId && isValidXSignature(redirect.signed, redirect.signature)) {
        paid = redirect.paid;
        try {
          const bill = await getBill(billId);
          if (bill) {
            paid = bill.paid === true;
            if (bill.reference_1) {
              target.searchParams.set("order_id", bill.reference_1);
            }
            await recordBillplzPayment({
              bill,
              transactionId: redirect.transactionId,
              transactionStatus: redirect.transactionStatus,
              signature: redirect.signature,
            });
          }
        } catch (err: any) {
          console.error("Billplz redirect error:", err);
        }
        target.searchParams.set("billcode", billId);
      } else {
        console.error("Billplz redirect rejected: invalid x_signature", billId);
      }

      target.searchParams.set("status_id", paid ? "1" : "3");
      return reply.redirect(target.toString());
    },
  );
};

// Success
// http://localhost:5173/toyyibpayconfigpage?status_id=1&billcode=d91enxrw&order_id=TEST123&msg=ok&transaction_id=TP2601154353784154


// ToyyibPay callback parsed: {
//   refno: 'TP2601154353784154',
//   status: '1',
//   reason: 'Payment Approved',
//   billcode: 'd91enxrw',
//   order_id: 'TEST123',
//   amount: '1.00',
//   status_id: '1',
//   msg: 'ok',
//   transaction_id: 'TP2601154353784154',
//   fpx_transaction_id: '2601150337384747',
//   hash: 'e65d98b4f3cdf1cc8858cf88f1b44498',
//   transaction_time: '2026-01-15 03:37:38'
// }

// Failed
// http://localhost:5173/toyyibpayconfigpage?status_id=3&billcode=6a1i76sy&order_id=TEST123&msg=ok&transaction_id=TP2601154792316690

// ToyyibPay callback parsed: {
//   refno: 'TP2601154792316690',
//   status: '3',
//   reason: 'Payment Unsuccessful',
//   billcode: '6a1i76sy',
//   order_id: 'TEST123',
//   amount: '1.00',
//   status_id: '3',
//   msg: 'ok',
//   transaction_id: 'TP2601154792316690',
//   fpx_transaction_id: '2601150339173414',
//   hash: 'de81f4b6520796cf37a429fbe132ed3d',
//   transaction_time: '2026-01-15 03:39:17'
// }
