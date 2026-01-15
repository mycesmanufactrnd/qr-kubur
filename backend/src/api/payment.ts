import type { FastifyInstance } from "fastify";
import { handleToyyibPayCallback } from "../services/toyyibpay.service.ts";

export const registerPaymentRoutes = (app: FastifyInstance) => {
  app.post("/api/payment/callback", async (req, reply) => {
    const parts = req.parts();
    const data: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === "field") {
        data[part.fieldname] = String(part.value);
      }
    }

    // console.log("ToyyibPay callback parsed:", data);

    try {
      await handleToyyibPayCallback(data);

      return reply.send("OK");
    } catch (err: any) {
      console.error("ToyyibPay callback error:", err);
      return reply.status(500).send("Error");
    }
  });
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