import { z } from "zod";
import { router, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { PaymentComparison } from "../db/entities.ts";

export const paymentComparisonRouter = router({
  getAll: protectedProcedure.query(async () => {
    const repo = AppDataSource.getRepository(PaymentComparison);
    return repo.find({ order: { gateway: "ASC", sortorder: "ASC", createdat: "ASC" } });
  }),

  addItem: protectedProcedure
    .input(z.object({ gateway: z.string().min(1), content: z.string() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentComparison);
      const last = await repo.findOne({
        where: { gateway: input.gateway },
        order: { sortorder: "DESC" },
      });
      const sortorder = last ? last.sortorder + 1 : 0;
      return repo.save(repo.create({ gateway: input.gateway, content: input.content, sortorder }));
    }),

  updateItem: protectedProcedure
    .input(z.object({ id: z.number(), content: z.string() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentComparison);
      const item = await repo.findOneByOrFail({ id: input.id });
      item.content = input.content;
      return repo.save(item);
    }),

  deleteItem: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentComparison);
      return repo.delete(input);
    }),

  deleteGateway: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentComparison);
      return repo.delete({ gateway: input });
    }),

  reorderItems: protectedProcedure
    .input(z.array(z.object({ id: z.number(), sortorder: z.number() })))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(PaymentComparison);
      await Promise.all(input.map(({ id, sortorder }) => repo.update(id, { sortorder })));
      return { success: true };
    }),
});
