// @ts-nocheck
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { GraveBlock, GraveSlot, DeadPerson } from "../db/entities.js";
import {
  graveBlockCreateSchema,
  graveBlockUpdateSchema,
} from "../schemas/graveBlockSchema.js";

export const graveMappingRouter = router({
  getBlocksByGrave: publicProcedure
    .input(z.object({ graveId: z.number() }))
    .query(async ({ input }) => {
      if (!input.graveId) return [];
      return await AppDataSource.getRepository(GraveBlock).find({
        where: { graveId: input.graveId },
        relations: ["slots", "slots.deadperson"],
        order: { id: "ASC" },
      });
    }),

  getSlotOptionsByGrave: publicProcedure
    .input(z.object({ graveId: z.number() }))
    .query(async ({ input }) => {
      if (!input.graveId) return [];
      const slots = await AppDataSource.getRepository(GraveSlot).find({
        where: { block: { graveId: input.graveId } },
        relations: ["block", "deadperson"],
        order: { blockId: "ASC", rowIndex: "ASC", colIndex: "ASC" },
      });

      return slots.map((slot) => ({
        id: slot.id,
        label: slot.label,
        blockLabel: slot.block?.label,
        occupant: slot.deadperson
          ? { id: slot.deadperson.id, name: slot.deadperson.name }
          : null,
      }));
    }),

  createBlock: protectedProcedure
    .input(graveBlockCreateSchema)
    .mutation(async ({ input }) => {
      const duplicate = await AppDataSource.getRepository(GraveBlock)
        .createQueryBuilder("block")
        .where("block.graveId = :graveId", { graveId: input.graveId })
        .andWhere("LOWER(block.label) = LOWER(:label)", {
          label: input.label,
        })
        .getOne();

      if (duplicate) {
        throw new Error(
          `A block named "${input.label}" already exists for this cemetery.`,
        );
      }

      return await AppDataSource.transaction(async (manager) => {
        const blockRepo = manager.getRepository(GraveBlock);
        const slotRepo = manager.getRepository(GraveSlot);

        const block = await blockRepo.save(
          blockRepo.create({
            graveId: input.graveId,
            label: input.label,
            corners: input.corners,
            rows: input.rows,
            cols: input.cols,
          }),
        );

        const slots = [];
        let index = 0;
        for (let rowIndex = 0; rowIndex < input.rows; rowIndex++) {
          for (let colIndex = 0; colIndex < input.cols; colIndex++) {
            index += 1;
            slots.push(
              slotRepo.create({
                blockId: block.id,
                rowIndex,
                colIndex,
                label: `${input.label}-${index}`,
              }),
            );
          }
        }
        await slotRepo.save(slots);

        return await blockRepo.findOne({
          where: { id: block.id },
          relations: ["slots", "slots.deadperson"],
        });
      });
    }),

  updateBlock: protectedProcedure
    .input(z.object({ id: z.number(), data: graveBlockUpdateSchema }))
    .mutation(async ({ input }) => {
      const blockRepo = AppDataSource.getRepository(GraveBlock);
      const block = await blockRepo.findOneByOrFail({ id: input.id });

      const duplicate = await blockRepo
        .createQueryBuilder("block")
        .where("block.graveId = :graveId", { graveId: block.graveId })
        .andWhere("block.id != :id", { id: input.id })
        .andWhere("LOWER(block.label) = LOWER(:label)", {
          label: input.data.label,
        })
        .getOne();

      if (duplicate) {
        throw new Error(
          `A block named "${input.data.label}" already exists for this cemetery.`,
        );
      }

      blockRepo.merge(block, input.data);
      return await blockRepo.save(block);
    }),

  updateSlot: protectedProcedure
    .input(z.object({ id: z.number(), label: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const slotRepo = AppDataSource.getRepository(GraveSlot);
      const slot = await slotRepo.findOneByOrFail({ id: input.id });
      slot.label = input.label;
      return await slotRepo.save(slot);
    }),

  deleteBlock: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const occupiedCount = await AppDataSource.getRepository(DeadPerson)
        .createQueryBuilder("deadperson")
        .innerJoin("deadperson.graveslot", "graveslot")
        .where("graveslot.blockId = :blockId", { blockId: input })
        .getCount();

      if (occupiedCount > 0) {
        throw new Error(
          "Cannot delete this block: it still has occupied slots. Unassign them first.",
        );
      }

      const blockRepo = AppDataSource.getRepository(GraveBlock);
      return await blockRepo.delete(input);
    }),
});
