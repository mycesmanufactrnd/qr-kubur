import z from "zod";
import { router, superAdminProcedure } from "../trpc.ts";
import { OnlineTransactionAccount } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";
import { OnlineTransactionStatus } from "../db/enums.ts";

export const paymentDistributionRouter = router({
    getPaginated: superAdminProcedure
        .input(
          z.object({
            page: z.number().min(1).optional(),
            pageSize: z.number().min(1).optional(),
          })
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
        })
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
});
