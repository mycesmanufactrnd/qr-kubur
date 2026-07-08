// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import {
  InventoryItem,
  InventoryPackage,
  InventoryTransaction,
} from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import {
  stockInSchema,
  stockOutSchema,
  adjustmentSchema,
  processPackageSchema,
} from "../schemas/inventoryTransactionSchema.js";
import {
  InventoryItemStatus,
  InventoryItemType,
  InventoryTransactionSource,
  InventoryTransactionType,
} from "../db/enums.js";
import { computeItemStatus } from "./inventoryItemRouter.js";

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: "tx.id",
  createdat: "tx.createdat",
  transaction_type: "tx.transaction_type",
  quantity: "tx.quantity",
  createdat: "tx.createdat",
};

export const inventoryTransactionRouter = router({
  // ── Read ──────────────────────────────────────────────────────────────────

  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(20),
        filterType: z.nativeEnum(InventoryTransactionType).optional(),
        filterItemId: z.number().int().positive().optional(),
        filterSource: z.nativeEnum(InventoryTransactionSource).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterType,
        filterItemId,
        filterSource,
        dateFrom,
        dateTo,
        sortField,
        sortOrder,
      } = input;

      const repo = AppDataSource.getRepository(InventoryTransaction);
      const query = repo
        .createQueryBuilder("tx")
        .leftJoinAndSelect("tx.item", "item")
        .leftJoinAndSelect("tx.package", "package")
        .leftJoinAndSelect("tx.createdby", "createdby");

      if (filterType) {
        query.andWhere("tx.transaction_type = :type", { type: filterType });
      }

      if (filterItemId) {
        query.andWhere("tx.itemId = :itemId", { itemId: filterItemId });
      }

      if (filterSource) {
        query.andWhere("tx.source = :source", { source: filterSource });
      }

      if (dateFrom) {
        query.andWhere("tx.createdat >= :dateFrom", { dateFrom });
      }

      if (dateTo) {
        query.andWhere("tx.createdat <= :dateTo", { dateTo });
      }

      const orderCol =
        ALLOWED_SORT_FIELDS[sortField ?? "createdat"] ??
        "tx.createdat";
      const orderDir = sortOrder ?? "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  // ── Stock In ───────────────────────────────────────────────────────────────

  stockIn: protectedProcedure
    .input(stockInSchema)
    .mutation(async ({ input, ctx }) => {
      const { itemId, quantity, source, notes } = input;

      return await AppDataSource.transaction(async (manager) => {
        const item = await manager.findOneByOrFail(InventoryItem, {
          id: itemId,
        });

        const beforeQty = item.current_quantity;
        const afterQty = beforeQty + quantity;
        // Reusable items track availability as IN_USE/AVAILABLE, not by quantity —
        // returning stock makes the item AVAILABLE again (unless flagged MISSING/MAINTENANCE).
        const newStatus =
          item.item_type === InventoryItemType.REUSABLE
            ? [InventoryItemStatus.MISSING, InventoryItemStatus.MAINTENANCE].includes(item.status)
              ? item.status
              : InventoryItemStatus.AVAILABLE
            : computeItemStatus(afterQty, item.minimum_level, item.item_type);

        await manager.update(InventoryItem, itemId, {
          current_quantity: afterQty,
          status: newStatus,
        });

        const tx = manager.create(InventoryTransaction, {
          transaction_type: InventoryTransactionType.STOCK_IN,
          itemId,
          quantity,
          before_quantity: beforeQty,
          after_quantity: afterQty,
          source: source ?? (item.item_type === InventoryItemType.REUSABLE
            ? InventoryTransactionSource.RETURN
            : InventoryTransactionSource.RESTOCK),
          notes,
          createdbyId: Number(ctx.user.id),
        });

        return await manager.save(tx);
      });
    }),

  // ── Stock Out ──────────────────────────────────────────────────────────────

  stockOut: protectedProcedure
    .input(stockOutSchema)
    .mutation(async ({ input, ctx }) => {
      const { itemId, quantity, jenazahCaseId, packageId, source, notes } = input;

      return await AppDataSource.transaction(async (manager) => {
        const item = await manager.findOneByOrFail(InventoryItem, { id: itemId });
        const resolvedSource = source ?? InventoryTransactionSource.MANUAL;

        if (item.current_quantity < quantity) {
          throw new Error(
            `Stok tidak mencukupi. Stok semasa: ${item.current_quantity}, diperlukan: ${quantity}`,
          );
        }

        const beforeQty = item.current_quantity;
        const afterQty = beforeQty - quantity;
        // Reusable items are marked IN_USE on stock-out rather than OUT_OF_STOCK —
        // they're checked back in via stockIn, not restocked by quantity.
        const newStatus =
          item.item_type === InventoryItemType.REUSABLE
            ? InventoryItemStatus.IN_USE
            : computeItemStatus(afterQty, item.minimum_level, item.item_type);

        await manager.update(InventoryItem, itemId, {
          current_quantity: afterQty,
          status: newStatus,
        });

        const tx = manager.create(InventoryTransaction, {
          transaction_type: InventoryTransactionType.STOCK_OUT,
          itemId,
          quantity: -quantity,
          before_quantity: beforeQty,
          after_quantity: afterQty,
          jenazahCaseId: jenazahCaseId ?? null,
          packageId: packageId ?? null,
          source: resolvedSource,
          notes,
          createdbyId: Number(ctx.user.id),
        });

        return await manager.save(tx);
      });
    }),

  // ── Adjustment ─────────────────────────────────────────────────────────────

  adjustment: protectedProcedure
    .input(adjustmentSchema)
    .mutation(async ({ input, ctx }) => {
      const { itemId, new_quantity, notes } = input;

      return await AppDataSource.transaction(async (manager) => {
        const item = await manager.findOneByOrFail(InventoryItem, {
          id: itemId,
        });

        const beforeQty = item.current_quantity;
        const diff = new_quantity - beforeQty;
        const newStatus = computeItemStatus(new_quantity, item.minimum_level);

        await manager.update(InventoryItem, itemId, {
          current_quantity: new_quantity,
          status: newStatus,
        });

        const tx = manager.create(InventoryTransaction, {
          transaction_type: InventoryTransactionType.ADJUSTMENT,
          itemId,
          quantity: diff,
          before_quantity: beforeQty,
          after_quantity: new_quantity,
          source: InventoryTransactionSource.MANUAL,
          notes,
          createdbyId: Number(ctx.user.id),
        });

        return await manager.save(tx);
      });
    }),

  // ── Process Package (replaces processJenazah Base44 function) ─────────────
  //
  // Best-effort: each item is processed independently. Errors are collected
  // and returned to the caller — successful items are NOT rolled back.
  // This mirrors the original Base44 behaviour.

  processPackage: protectedProcedure
    .input(processPackageSchema)
    .mutation(async ({ input, ctx }) => {
      const { packageId, jenazahId } = input;

      const pkg = await AppDataSource.getRepository(InventoryPackage).findOne({
        where: { id: packageId },
        relations: ["packageItems", "packageItems.item", "packageItems.group"],
      });

      if (!pkg) throw new Error("Pakej tidak dijumpai");

      const results = {
        consumables: [] as { item_name: string; before: number; after: number }[],
        errors: [] as string[],
      };

      for (const pi of pkg.packageItems ?? []) {
        try {
          await AppDataSource.transaction(async (manager) => {
            // Group-based reusable line — resolve the fulfilling item from
            // the group's members instead of a fixed itemId.
            const item = pi.groupId
              ? await manager
                  .createQueryBuilder(InventoryItem, "item")
                  .where("item.groupId = :groupId", { groupId: pi.groupId })
                  .andWhere("item.current_quantity >= :qty", { qty: pi.quantity_required })
                  .andWhere("item.status = :status", { status: InventoryItemStatus.AVAILABLE })
                  .orderBy("item.id", "ASC")
                  .getOne()
              : await manager.findOneByOrFail(InventoryItem, { id: pi.itemId });

            if (!item) {
              throw new Error(
                `Tiada item dalam kumpulan "${pi.group?.name}" dengan stok mencukupi (diperlukan: ${pi.quantity_required})`,
              );
            }

            if (item.current_quantity < pi.quantity_required) {
              throw new Error(
                `Stok tidak mencukupi untuk ${item.item_name}. Stok: ${item.current_quantity}, diperlukan: ${pi.quantity_required}`,
              );
            }

            const beforeQty = item.current_quantity;
            const afterQty = beforeQty - pi.quantity_required;
            const newStatus =
              item.item_type === InventoryItemType.REUSABLE
                ? InventoryItemStatus.IN_USE
                : computeItemStatus(afterQty, item.minimum_level, item.item_type);

            await manager.update(InventoryItem, item.id, {
              current_quantity: afterQty,
              status: newStatus,
            });

            await manager.save(
              manager.create(InventoryTransaction, {
                transaction_type: InventoryTransactionType.STOCK_OUT,
                jenazahCaseId: jenazahId,
                packageId,
                itemId: item.id,
                quantity: -pi.quantity_required,
                before_quantity: beforeQty,
                after_quantity: afterQty,
                source: InventoryTransactionSource.KES,
                createdbyId: Number(ctx.user.id),
              }),
            );

            results.consumables.push({
              item_name: item.item_name,
              before: beforeQty,
              after: afterQty,
            });
          });
        } catch (e: any) {
          results.errors.push(e.message ?? `Ralat memproses ${pi.item?.item_name ?? pi.group?.name}`);
        }
      }

      return { success: true, packageId, jenazahId, results };
    }),

  // ── Dashboard summary ──────────────────────────────────────────────────────

  getDashboardStats: protectedProcedure.query(async () => {
    const itemRepo = AppDataSource.getRepository(InventoryItem);

    const [totalItems, lowStockCount, outOfStockCount] =
      await Promise.all([
        itemRepo.count(),
        itemRepo.count({ where: { status: InventoryItemStatus.LOW_STOCK } }),
        itemRepo.count({ where: { status: InventoryItemStatus.OUT_OF_STOCK } }),
      ]);

    // Recent transactions (last 10).
    const recentTransactions = await AppDataSource.getRepository(
      InventoryTransaction,
    )
      .createQueryBuilder("tx")
      .leftJoinAndSelect("tx.item", "item")
      .orderBy("tx.createdat", "DESC")
      .take(10)
      .getMany();

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      recentTransactions,
    };
  }),

  // ── Reports ────────────────────────────────────────────────────────────────

  getStockSummary: protectedProcedure.query(async () => {
    return await AppDataSource.getRepository(InventoryItem)
      .createQueryBuilder("item")
      .select("item.category", "category")
      .addSelect("COUNT(item.id)", "total_items")
      .addSelect("SUM(item.current_quantity)", "total_quantity")
      .addSelect(
        `SUM(CASE WHEN item.status = 'AVAILABLE' THEN 1 ELSE 0 END)`,
        "available_count",
      )
      .addSelect(
        `SUM(CASE WHEN item.status = 'LOW_STOCK' THEN 1 ELSE 0 END)`,
        "low_stock_count",
      )
      .addSelect(
        `SUM(CASE WHEN item.status = 'OUT_OF_STOCK' THEN 1 ELSE 0 END)`,
        "out_of_stock_count",
      )
      .groupBy("item.category")
      .orderBy("item.category", "ASC")
      .getRawMany();
  }),

  getTransactionReport: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string(),
        dateTo: z.string(),
        filterType: z.nativeEnum(InventoryTransactionType).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { dateFrom, dateTo, filterType } = input;

      const query = AppDataSource.getRepository(InventoryTransaction)
        .createQueryBuilder("tx")
        .leftJoinAndSelect("tx.item", "item")
        .leftJoinAndSelect("tx.package", "package")
        .leftJoinAndSelect("tx.createdby", "createdby")
        .where("tx.createdat >= :dateFrom", { dateFrom })
        .andWhere("tx.createdat <= :dateTo", { dateTo });

      if (filterType) {
        query.andWhere("tx.transaction_type = :type", { type: filterType });
      }

      return query.orderBy("tx.createdat", "DESC").getMany();
    }),
});
