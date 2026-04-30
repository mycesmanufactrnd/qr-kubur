import { protectedProcedure, router } from "../trpc.ts";
import { CollectionTree, CollectionTreeItem } from "../db/entities.ts";
import { AppDataSource } from "../datasource.ts";
import { z } from "zod";
import {
  collectionTreeSchema,
  collectionTreeItemSchema,
} from "../schemas/collectionTreeSchema.ts";

export const collectionTreeRouter = router({
  getByOrganisation: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .query(async ({ input }) => {
      return AppDataSource.getRepository(CollectionTree).find({
        where: { organisationId: input.organisationId },
        order: { createdat: "DESC" },
      });
    }),

  create: protectedProcedure
    .input(collectionTreeSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(CollectionTree);
      const entity = repo.create({
        name: input.name,
        description: input.description ?? null,
        organisation: input.organisation ?? undefined,
        organisationId: input.organisation?.id ?? null,
      });
      return repo.save(entity);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(CollectionTree);
      await repo.update(input.id, {
        name: input.name,
        description: input.description ?? null,
      });
      return repo.findOneBy({ id: input.id });
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await AppDataSource.getRepository(CollectionTreeItem).delete({
        collectionTreeId: input,
      });
      await AppDataSource.getRepository(CollectionTree).delete(input);
      return { success: true };
    }),

  getItems: protectedProcedure
    .input(z.object({ collectionTreeId: z.number() }))
    .query(async ({ input }) => {
      return AppDataSource.getRepository(CollectionTreeItem).find({
        where: { collectionTreeId: input.collectionTreeId },
        relations: ["grave", "mosque", "tahfiz", "organisation"],
        order: { createdat: "DESC" },
      });
    }),

  addItem: protectedProcedure
    .input(collectionTreeItemSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(CollectionTreeItem);
      const entity = repo.create({
        collectionTreeId: input.collectionTreeId,
        graveId: input.graveId ?? null,
        mosqueId: input.mosqueId ?? null,
        tahfizId: input.tahfizId ?? null,
        organisationId: input.organisationId ?? null,
      });
      return repo.save(entity);
    }),

  removeItem: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      await AppDataSource.getRepository(CollectionTreeItem).delete(input);
      return { success: true };
    }),
});
