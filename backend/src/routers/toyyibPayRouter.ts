import { z } from "zod";
import { router, publicProcedure } from "../trpc.ts";
import { createBill, upsertTransactionAccountByOrderNo } from "../services/toyyibpay.service.ts";
import { getToyyibpayConfig } from "../config/toyyibpay.config.ts";

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

      if (!bill?.status || !bill?.data?.BillCode) {
        return {
          message: bill?.message ?? 'Payment Failed',
          billCode: null,
          paymentUrl: null,
        };
      }

      const toyyibpayConfig = getToyyibpayConfig();
      let baseUrl = toyyibpayConfig.baseUrl;

      return {
        billCode: bill.data.BillCode,
        paymentUrl: `${baseUrl}/${bill.data.BillCode}`,
      };
    }),

  saveTransactionAccount: publicProcedure
    .input(
      z.object({
        orderNo: z.string().trim().min(1),
        accountNo: z.string().trim().min(1),
        bankName: z.string().trim().min(1),
        type: z.string().trim().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await upsertTransactionAccountByOrderNo({
        orderNo: input.orderNo,
        accountNo: input.accountNo,
        bankName: input.bankName,
        type: input.type,
      });
    }),
});
