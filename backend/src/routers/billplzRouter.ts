// @ts-nocheck
// routers/billplzRouter.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { createBill } from "../services/billplz.service.js";

export const billplzRouter = router({
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const bill = await createBill({
        ...input,
        phone: input.phone || "0123456789",
      });

      if (!bill || !bill.id) {
        throw new Error(
          "Validation Error: Billplz rejected the payload. Check your Collection ID.",
        );
      }

      return {
        billId: bill.id,
        paymentUrl: bill.url,
      };
    }),
});
