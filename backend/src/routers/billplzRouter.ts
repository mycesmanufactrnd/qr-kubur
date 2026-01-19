// routers/billplzRouter.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import { createBill } from "../services/billplz.service.ts";

export const billplzRouter = router({
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string(),
        name: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const bill = await createBill(input);

      return {
        billId: bill.id,
        paymentUrl: bill.url, // URL for customer redirection
      };
    }),
});