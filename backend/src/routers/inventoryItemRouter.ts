// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import { InventoryItem } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import { inventoryItemSchema } from "../schemas/inventoryItemSchema.js";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
} from "../db/enums.js";

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: "item.id",
  item_code: "item.item_code",
  item_name: "item.item_name",
  category: "item.category",
  item_type: "item.item_type",
  current_quantity: "item.current_quantity",
  status: "item.status",
  createdat: "item.createdat",
};

export const inventoryItemRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterCategory: z.nativeEnum(InventoryItemCategory).optional(),
        filterType: z.nativeEnum(InventoryItemType).optional(),
        filterStatus: z.nativeEnum(InventoryItemStatus).optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterName,
        filterCategory,
        filterType,
        filterStatus,
        sortField,
        sortOrder,
      } = input;

      const repo = AppDataSource.getRepository(InventoryItem);
      const query = repo.createQueryBuilder("item");

      if (filterName) {
        query.andWhere(
          "(item.item_name ILIKE :name OR item.item_code ILIKE :name)",
          { name: `%${filterName}%` },
        );
      }

      if (filterCategory) {
        query.andWhere("item.category = :category", {
          category: filterCategory,
        });
      }

      if (filterType) {
        query.andWhere("item.item_type = :item_type", { item_type: filterType });
      }

      if (filterStatus) {
        query.andWhere("item.status = :status", { status: filterStatus });
      }

      const orderCol =
        ALLOWED_SORT_FIELDS[sortField ?? "id"] ?? "item.id";
      const orderDir = sortOrder ?? "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  getAll: protectedProcedure.query(async () => {
    return await AppDataSource.getRepository(InventoryItem).find({
      select: ["id", "item_code", "item_name", "item_type", "unit_type", "current_quantity", "status"],
      order: { item_name: "ASC" },
    });
  }),

  getById: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ input }) => {
      return await AppDataSource.getRepository(InventoryItem).findOneOrFail({
        where: { id: input },
      });
    }),

  getLowStock: protectedProcedure.query(async () => {
    const repo = AppDataSource.getRepository(InventoryItem);
    return await repo
      .createQueryBuilder("item")
      .where("item.status IN (:...statuses)", {
        statuses: [InventoryItemStatus.LOW_STOCK, InventoryItemStatus.OUT_OF_STOCK],
      })
      .orderBy("item.current_quantity", "ASC")
      .getMany();
  }),

  create: protectedProcedure
    .input(inventoryItemSchema)
    .mutation(async ({ input, ctx }) => {
      const repo = AppDataSource.getRepository(InventoryItem);

      const status = computeItemStatus(
        input.current_quantity ?? 0,
        input.minimum_level ?? 0,
      );

      const item = repo.create({
        ...input,
        status,
        createdbyId: Number(ctx.user.id),
      });

      return await repo.save(item);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: inventoryItemSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(InventoryItem);
      const item = await repo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      // Recompute status whenever quantity or threshold changes.
      const newQty =
        cleanedInput.current_quantity ?? item.current_quantity;
      const newMin =
        cleanedInput.minimum_level ?? item.minimum_level;
      cleanedInput.status = computeItemStatus(newQty, newMin);

      repo.merge(item, cleanedInput);
      return await repo.save(item);
    }),

  delete: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(InventoryItem);

      // Prevent deletion if active assets are assigned to this item.
      const assetCount = await AppDataSource.getRepository("InventoryAsset")
        .createQueryBuilder("asset")
        .where("asset.itemId = :id", { id: input })
        .getCount();

      if (assetCount > 0) {
        throw new Error(
          "Tidak boleh padam item yang mempunyai aset. Padam aset dahulu.",
        );
      }

      return await repo.delete(input);
    }),
});

/** Derive InventoryItemStatus from current quantity vs minimum level. */
export function computeItemStatus(
  currentQty: number,
  minimumLevel: number,
): InventoryItemStatus {
  if (currentQty <= 0) return InventoryItemStatus.OUT_OF_STOCK;
  if (currentQty <= minimumLevel) return InventoryItemStatus.LOW_STOCK;
  return InventoryItemStatus.AVAILABLE;
}
