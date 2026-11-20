import type { FastifyInstance } from "fastify";
import {
  getBill,
  getBillplzReturnUrl,
  isValidXSignature,
  parseRedirectQuery,
  recordBillplzPayment,
} from "../services/billplz.service.js";

export const registerPaymentRoutes = (app: FastifyInstance) => {
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
  // page with `?status_id=1|3&order_id=&billcode=`, the query shape the pages parse.
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
