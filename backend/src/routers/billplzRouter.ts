// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { createBill } from "../services/billplz.service.js";

// Same input/output shape as toyyibPay.createBill so pages can switch gateways freely.
export const billplzRouter = router({
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        returnTo: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const bill = await createBill({
        amount: input.amount,
        referenceNo: input.referenceNo || "",
        name: input.name || "ANONYMOUS",
        email: input.email || "noreply@gmail.com",
        phone: input.phone || null,
        returnTo: input.returnTo || "config",
      });

      if (!bill?.status || !bill?.data?.id) {
        return {
          message: bill?.message ?? "Payment Failed",
          billCode: null,
          paymentUrl: null,
        };
      }

      return {
        billCode: bill.data.id,
        paymentUrl: bill.data.url,
      };
    }),
});
