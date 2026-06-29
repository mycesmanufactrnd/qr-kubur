// @ts-nocheck
import z from "zod";
import { protectedProcedure, router, superAdminProcedure } from "../trpc.js";
import {
  OnlineTransaction,
  OnlineTransactionAccount,
  Donation,
  TahlilRequest,
  Quotation,
  Organisation,
  TahfizCenter,
} from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { OnlineTransactionStatus } from "../db/enums.js";

export const paymentDistributionRouter = router({
  getPaginated: superAdminProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page = 1, pageSize = 10 } = input;

      const accountRepo = AppDataSource.getRepository(OnlineTransactionAccount);

      const qb = accountRepo
        .createQueryBuilder("account")
        .leftJoinAndSelect("account.transaction", "transaction")
        // Donation join
        .leftJoin(
          Donation,
          "donation",
          "donation.referenceno = transaction.orderno AND account.type = 'Donation'",
        )
        .leftJoin(Organisation, "donOrg", "donOrg.id = donation.organisationId")
        .leftJoin(TahfizCenter, "donTc", "donTc.id = donation.tahfizcenterId")
        // Tahlil join
        .leftJoin(
          TahlilRequest,
          "tahlil",
          "tahlil.referenceno = transaction.orderno AND account.type = 'Tahlil'",
        )
        .leftJoin(TahfizCenter, "tahlilTc", "tahlilTc.id = tahlil.tahfizcenterId")
        // Organisation / Quotation join
        .leftJoin(
          Quotation,
          "quotation",
          "quotation.referenceno = transaction.orderno AND account.type = 'Organisation'",
        )
        .leftJoin(Organisation, "quotOrg", "quotOrg.id = quotation.organisationId")
        // Select entity fields
        .addSelect([
          "donation.status",
          "donation.donorname",
          "donation.donoremail",
          "donation.donorphoneno",
          "donation.amount",
        ])
        .addSelect(["donOrg.name"])
        .addSelect(["donTc.name"])
        .addSelect([
          "tahlil.status",
          "tahlil.requestorname",
          "tahlil.requestoremail",
          "tahlil.requestorphoneno",
          "tahlil.serviceamount",
        ])
        .addSelect(["tahlilTc.name"])
        .addSelect([
          "quotation.status",
          "quotation.payername",
          "quotation.payeremail",
          "quotation.payerphone",
          "quotation.totalamount",
        ])
        .addSelect(["quotOrg.name"]);

      const total = await qb.getCount();

      const { raw: rawItems, entities } = await qb
        .orderBy("account.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getRawAndEntities();

      const items = entities.map((entity, i) => {
        const r = rawItems[i];
        return {
          ...entity,
          entityStatus:
            r.donation_status ?? r.tahlil_status ?? r.quotation_status ?? null,
          tiedToName:
            r.donOrg_name ??
            r.donTc_name ??
            r.tahlilTc_name ??
            r.quotOrg_name ??
            null,
          payerName:
            r.donation_donorname ??
            r.tahlil_requestorname ??
            r.quotation_payername ??
            null,
          payerEmail:
            r.donation_donoremail ??
            r.tahlil_requestoremail ??
            r.quotation_payeremail ??
            null,
          payerPhone:
            r.donation_donorphoneno ??
            r.tahlil_requestorphoneno ??
            r.quotation_payerphone ??
            null,
          entityAmount:
            r.donation_amount != null
              ? r.donation_amount
              : r.tahlil_serviceamount != null
                ? r.tahlil_serviceamount
                : r.quotation_totalamount ?? null,
        };
      });

      return { items, total };
    }),

  updateStatus: superAdminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.nativeEnum(OnlineTransactionStatus),
        referencetransferno: z.string().nullable().optional(),
        photourl: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const accountRepo = AppDataSource.getRepository(OnlineTransactionAccount);
      const account = await accountRepo.findOne({
        where: { id: input.id },
      });

      if (!account) {
        throw new Error("Online transaction account not found.");
      }

      account.status = input.status;
      if (input.referencetransferno !== undefined) {
        account.referencetransferno = input.referencetransferno;
      }
      if (input.photourl !== undefined) {
        account.photourl = input.photourl;
      }
      return accountRepo.save(account);
    }),

  getOnlineTransaction: protectedProcedure
    .input(
      z.object({
        referenceno: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const { referenceno } = input;

      const transactionRepo = AppDataSource.getRepository(OnlineTransaction);

      const transaction = await transactionRepo
        .createQueryBuilder("transaction")
        .leftJoinAndSelect("transaction.accounts", "account")
        .where("transaction.orderno = :ref", { ref: referenceno })
        .orderBy("transaction.createdat", "DESC")
        .addOrderBy("account.createdat", "DESC")
        .getOne();

      return transaction ?? null;
    }),
});
