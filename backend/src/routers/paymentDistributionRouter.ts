import z from "zod";
import { protectedProcedure, router, superAdminProcedure } from "../trpc.ts";
import { OnlineTransaction, OnlineTransactionAccount } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransactionStatus } from "../db/enums.ts";

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
      const query = accountRepo
        .createQueryBuilder("account")
        .leftJoinAndSelect("account.transaction", "transaction");

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const [items, total] = await query
        .orderBy("account.createdat", "DESC")
        .getManyAndCount();

      return { items, total };
    }),

  updateStatus: superAdminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.nativeEnum(OnlineTransactionStatus),
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
