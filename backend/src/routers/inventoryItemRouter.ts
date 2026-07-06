// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import {
  CheckDetail,
  InventoryAsset,
  InventoryItem,
  InventoryTransaction,
  PackageItem,
} from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import { In } from "typeorm";
import { inventoryItemSchema } from "../schemas/inventoryItemSchema.js";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryTransactionSource,
  InventoryTransactionType,
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
      select: ["id", "item_code", "item_name", "category", "item_type", "unit_type", "current_quantity", "status", "minimum_level", "location"],
      relations: ["assets"],
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
      if (input.item_code) {
        const existing = await AppDataSource.getRepository(InventoryItem).findOneBy({ item_code: input.item_code });
        if (existing) {
          throw new Error(`Kod item "${input.item_code}" sudah wujud. Sila gunakan kod yang lain.`);
        }
      }

      return await AppDataSource.transaction(async (manager) => {
        const status = computeItemStatus(
          input.current_quantity ?? 0,
          input.minimum_level ?? 0,
          input.item_type,
        );

        const item = manager.create(InventoryItem, {
          ...input,
          status,
          createdbyId: Number(ctx.user.id),
        });

        const savedItem = await manager.save(item);

        // Auto-log initial stock for all item types
        if ((input.current_quantity ?? 0) > 0) {
          const qty = input.current_quantity ?? 0;
          await manager.save(
            manager.create(InventoryTransaction, {
              transaction_type: InventoryTransactionType.STOCK_IN,
              itemId: savedItem.id,
              quantity: qty,
              before_quantity: 0,
              after_quantity: qty,
              source: InventoryTransactionSource.RESTOCK,
              notes: "Stok awal item",
              createdbyId: Number(ctx.user.id),
            }),
          );
        }

        return savedItem;
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: inventoryItemSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(InventoryItem);
      const item = await repo.findOneByOrFail({ id: input.id });

      if (input.data.item_code) {
        const existing = await repo.findOneBy({ item_code: input.data.item_code });
        if (existing && existing.id !== input.id) {
          throw new Error(`Kod item "${input.data.item_code}" sudah wujud. Sila gunakan kod yang lain.`);
        }
      }

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      // Only recompute status for consumables; reusable status is set by stock operations.
      const resolvedType = cleanedInput.item_type ?? item.item_type;
      if (resolvedType !== InventoryItemType.REUSABLE) {
        const newQty = cleanedInput.current_quantity ?? item.current_quantity;
        const newMin = cleanedInput.minimum_level ?? item.minimum_level;
        cleanedInput.status = computeItemStatus(newQty, newMin, resolvedType);
      }

      repo.merge(item, cleanedInput);
      return await repo.save(item);
    }),

  deleteByLocation: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input: location }) => {
      return await AppDataSource.transaction(async (manager) => {
        const items = await manager.find(InventoryItem, { where: { location } });
        if (items.length === 0) return { deleted: 0 };

        const ids = items.map((i) => i.id);

        // Must delete in dependency order due to RESTRICT foreign keys
        await manager.delete(CheckDetail, { itemId: In(ids) });
        await manager.delete(InventoryTransaction, { itemId: In(ids) });
        await manager.delete(InventoryAsset, { itemId: In(ids) });
        await manager.delete(PackageItem, { itemId: In(ids) });
        await manager.delete(InventoryItem, { id: In(ids) });

        return { deleted: items.length };
      });
    }),

  delete: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      return await AppDataSource.transaction(async (manager) => {
        const ids = [input];
        await manager.delete(CheckDetail, { itemId: In(ids) });
        await manager.delete(InventoryTransaction, { itemId: In(ids) });
        await manager.delete(InventoryAsset, { itemId: In(ids) });
        await manager.delete(PackageItem, { itemId: In(ids) });
        await manager.delete(InventoryItem, { id: In(ids) });
        return { deleted: 1 };
      });
    }),
});

/** Derive InventoryItemStatus from quantity, minimum level, and item type. */
export function computeItemStatus(
  currentQty: number,
  minimumLevel: number,
  itemType?: string,
): InventoryItemStatus {
  if (itemType === InventoryItemType.REUSABLE) {
    return currentQty >= 1 ? InventoryItemStatus.AVAILABLE : InventoryItemStatus.OUT_OF_STOCK;
  }
  if (currentQty <= 0) return InventoryItemStatus.OUT_OF_STOCK;
  if (currentQty <= minimumLevel) return InventoryItemStatus.LOW_STOCK;
  return InventoryItemStatus.AVAILABLE;
}
