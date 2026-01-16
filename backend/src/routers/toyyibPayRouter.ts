import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import { createBill } from "../services/toyyibpay.service.ts";

export const toyyibPayRouter = router({
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const bill = await createBill({
        amount: input.amount,
        referenceNo: input.referenceNo,
        name: input.name,
        email: input.email,
        phone: input.phone,
      });

      return {
        billCode: bill.BillCode,
        paymentUrl: `https://dev.toyyibpay.com/${bill.BillCode}`,
      };
    }),
});
