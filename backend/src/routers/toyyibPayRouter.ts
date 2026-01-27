import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import { createBill } from "../services/toyyibpay.service.ts";

export const toyyibPayRouter = router({
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        returnTo: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const bill = await createBill({
        amount: input.amount,
        referenceNo: input?.referenceNo || '',
        name: input?.name || 'ANONYMOUS',
        email: input?.email || 'noreply@gmail.com',
        phone: input?.phone || '0123456789',
        returnTo: input.returnTo,
      });

      return {
        billCode: bill.BillCode,
        paymentUrl: `https://dev.toyyibpay.com/${bill.BillCode}`,
      };
    }),
});
