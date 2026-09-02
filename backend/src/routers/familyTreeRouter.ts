// @ts-nocheck
import z from "zod";
import { publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { FamilyTree } from "../db/entities.js";

export const familyTreeRouter = router({
  getByGoogleUser: publicProcedure
    .input(z.object({ googleUserId: z.number().optional().nullable() }))
    .query(async ({ input }) => {
      if (!input.googleUserId) return [];

      return await AppDataSource.getRepository(FamilyTree).find({
        where: { googleuser: { id: input.googleUserId } },
        relations: ["deadperson", "deadperson.grave"],
        order: { createdat: "DESC" },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        googleuserId: z.number(),
        deadpersonId: z.number(),
        relation: z.string(),
        relationother: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(FamilyTree);

      const existing = await repo.findOne({
        where: {
          googleuser: { id: input.googleuserId },
          deadperson: { id: input.deadpersonId },
        },
      });
      if (existing) {
        throw new Error("This person is already saved in your family tree.");
      }

      const record = repo.create({
        googleuser: { id: input.googleuserId },
        deadperson: { id: input.deadpersonId },
        relation: input.relation,
        relationother:
          input.relation === "other"
            ? input.relationother?.trim() || null
            : null,
      });
      return await repo.save(record);
    }),

  delete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    const repo = AppDataSource.getRepository(FamilyTree);
    return await repo.delete(input);
  }),
});
