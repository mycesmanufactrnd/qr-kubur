// @ts-nocheck
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { MosqueOrganisationChart } from "../db/entities.js";
import { mosqueOrganisationChartSchema } from "../schemas/mosqueOrganisationChartSchema.js";

export const mosqueOrganisationChartRouter = router({
  getByMosqueId: publicProcedure
    .input(z.object({ mosqueId: z.number() }))
    .query(async ({ input }) => {
      if (!input.mosqueId) return [];

      return await AppDataSource.getRepository(MosqueOrganisationChart).find({
        where: { mosque: { id: input.mosqueId } },
        order: { team: "ASC", id: "ASC" },
      });
    }),

  create: protectedProcedure
    .input(mosqueOrganisationChartSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(MosqueOrganisationChart);
      const chart = repo.create(input);
      return await repo.save(chart);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: mosqueOrganisationChartSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(MosqueOrganisationChart);
      const chart = await repo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      repo.merge(chart, cleanedInput);
      return await repo.save(chart);
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const repo = AppDataSource.getRepository(MosqueOrganisationChart);
    return await repo.delete(input);
  }),
});
