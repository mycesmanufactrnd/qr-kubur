// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import {
  createBill,
  upsertTransactionAccountByOrderNo,
} from "../services/billplz.service.js";
import { AppDataSource } from "../datasource.js";
import { OnlineTransaction } from "../db/entities.js";

// Gateway-neutral DB lookup by order no (native status polling).
const getTransactionStatusByOrderNo = publicProcedure
  .input(z.object({ orderNo: z.string().trim().min(1) }))
  .query(async ({ input }) => {
    return await AppDataSource.getRepository(OnlineTransaction).findOne({
      where: { orderno: input.orderNo },
      order: { createdat: "DESC" },
    });
  });

const saveTransactionAccount = publicProcedure
  .input(
    z.object({
      orderNo: z.string().trim().min(1),
      accountNo: z.string().trim().min(1),
      bankName: z.string().trim().min(1),
      type: z.string().trim().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    return await upsertTransactionAccountByOrderNo({
      orderNo: input.orderNo,
      accountNo: input.accountNo,
      bankName: input.bankName,
      type: input.type,
    });
  });

export const billplzRouter = router({
  getTransactionStatusByOrderNo,
  saveTransactionAccount,
  createBill: publicProcedure
    .input(
      z.object({
        amount: z.number(),
        referenceNo: z.string().optional().nullable(),
        name: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        returnTo: z.string().optional().nullable(),
        // Google users get no JWT (authRouter.loginGoogle), so the page sends their id.
        // Lenient on purpose: a bad id must never block the payment, it's just not recorded.
        googleUserId: z.union([z.number(), z.string()]).optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Who is paying → OnlineTransaction.userid / usertablereference.
      // The page's Google user wins: the public payment pages are the Google-user flow,
      // and an admin JWT cookie on the same browser doesn't mean the admin is paying.
      let userTable: "Users" | "GoogleUser" | null = null;
      let userId: string | number | null = null;
      const googleUserId = Number(input.googleUserId);
      if (Number.isInteger(googleUserId) && googleUserId > 0) {
        userTable = "GoogleUser";
        userId = googleUserId;
      } else if (ctx.user?.id && ctx.user.type !== "refresh") {
        userTable = "Users";
        userId = ctx.user.id;
      }

      const bill = await createBill({
        amount: input.amount,
        referenceNo: input.referenceNo || "",
        name: input.name || "ANONYMOUS",
        email: input.email || "noreply@gmail.com",
        phone: input.phone || null,
        returnTo: input.returnTo || "config",
        userTable,
        userId,
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
