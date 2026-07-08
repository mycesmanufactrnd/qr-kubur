// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import { ReusableItemGroup } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";

export const reusableItemGroupRouter = router({
  getAll: protectedProcedure.query(async () => {
    const repo = AppDataSource.getRepository(ReusableItemGroup);
    return repo.find({ order: { name: "ASC" } });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(ReusableItemGroup);
      const existing = await repo.findOne({ where: { name: input.name } });
      if (existing) return existing;
      const group = repo.create({ name: input.name });
      return repo.save(group);
    }),
});
