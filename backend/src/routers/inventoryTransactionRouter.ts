// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import {
  InventoryAsset,
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
import { returnAssetSchema } from "../schemas/inventoryAssetSchema.js";
import {
  InventoryAssetStatus,
  InventoryItemStatus,
  InventoryItemType,
  InventoryTransactionSource,
  InventoryTransactionType,
} from "../db/enums.js";
import { computeItemStatus } from "./inventoryItemRouter.js";

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: "tx.id",
  transaction_date: "tx.transaction_date",
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
        .leftJoinAndSelect("tx.asset", "asset")
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
        query.andWhere("tx.transaction_date >= :dateFrom", { dateFrom });
      }

      if (dateTo) {
        query.andWhere("tx.transaction_date <= :dateTo", { dateTo });
      }

      const orderCol =
        ALLOWED_SORT_FIELDS[sortField ?? "transaction_date"] ??
        "tx.transaction_date";
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
        const newStatus = computeItemStatus(afterQty, item.minimum_level);

        await manager.update(InventoryItem, itemId, {
          current_quantity: afterQty,
          status: newStatus,
        });

        const tx = manager.create(InventoryTransaction, {
          transaction_type: InventoryTransactionType.STOCK_IN,
          itemId,
          item_name_snapshot: item.item_name,
          quantity,
          before_quantity: beforeQty,
          after_quantity: afterQty,
          source: source ?? InventoryTransactionSource.MANUAL,
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
      const { itemId, quantity, reference_type, referenceId, notes } = input;

      return await AppDataSource.transaction(async (manager) => {
        const item = await manager.findOneByOrFail(InventoryItem, {
          id: itemId,
        });

        if (item.current_quantity < quantity) {
          throw new Error(
            `Stok tidak mencukupi. Stok semasa: ${item.current_quantity}, diperlukan: ${quantity}`,
          );
        }

        const beforeQty = item.current_quantity;
        const afterQty = beforeQty - quantity;
        const newStatus = computeItemStatus(afterQty, item.minimum_level);

        await manager.update(InventoryItem, itemId, {
          current_quantity: afterQty,
          status: newStatus,
        });

        const tx = manager.create(InventoryTransaction, {
          transaction_type: InventoryTransactionType.STOCK_OUT,
          itemId,
          item_name_snapshot: item.item_name,
          quantity: -quantity,
          before_quantity: beforeQty,
          after_quantity: afterQty,
          reference_type,
          referenceId,
          source: InventoryTransactionSource.MANUAL,
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
          item_name_snapshot: item.item_name,
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
        relations: ["packageItems", "packageItems.item"],
      });

      if (!pkg) throw new Error("Pakej tidak dijumpai");

      const results = {
        consumables: [] as { item_name: string; before: number; after: number }[],
        reusables: [] as { item_name: string; asset_number: string; status: string }[],
        errors: [] as string[],
      };

      const now = new Date();

      for (const pi of pkg.packageItems ?? []) {
        if (pi.item_type === InventoryItemType.ONE_TIME) {
          // Consumable: deduct from stock quantity.
          try {
            await AppDataSource.transaction(async (manager) => {
              const item = await manager.findOneByOrFail(InventoryItem, {
                id: pi.itemId,
              });

              if (item.current_quantity < pi.quantity_required) {
                throw new Error(
                  `Stok tidak mencukupi untuk ${item.item_name}. Stok: ${item.current_quantity}, diperlukan: ${pi.quantity_required}`,
                );
              }

              const beforeQty = item.current_quantity;
              const afterQty = beforeQty - pi.quantity_required;
              const newStatus = computeItemStatus(afterQty, item.minimum_level);

              await manager.update(InventoryItem, pi.itemId, {
                current_quantity: afterQty,
                status: newStatus,
              });

              await manager.save(
                manager.create(InventoryTransaction, {
                  transaction_date: now,
                  transaction_type: InventoryTransactionType.STOCK_OUT,
                  reference_type: "JENAZAH_MODULE",
                  referenceId: jenazahId,
                  packageId,
                  package_name_snapshot: pkg.package_name,
                  itemId: pi.itemId,
                  item_name_snapshot: item.item_name,
                  quantity: -pi.quantity_required,
                  before_quantity: beforeQty,
                  after_quantity: afterQty,
                  source: InventoryTransactionSource.JENAZAH_MODULE,
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
            results.errors.push(e.message ?? `Ralat memproses ${pi.item?.item_name}`);
          }
        } else {
          // Reusable: assign the first available asset for this item.
          try {
            await AppDataSource.transaction(async (manager) => {
              const asset = await manager
                .createQueryBuilder(InventoryAsset, "asset")
                .where("asset.itemId = :itemId", { itemId: pi.itemId })
                .andWhere("asset.current_status = :status", {
                  status: InventoryAssetStatus.AVAILABLE,
                })
                .orderBy("asset.id", "ASC")
                .getOne();

              if (!asset) {
                throw new Error(
                  `Tiada aset tersedia untuk ${pi.item?.item_name ?? `item #${pi.itemId}`}`,
                );
              }

              await manager.update(InventoryAsset, asset.id, {
                current_status: InventoryAssetStatus.IN_USE,
                assignedJenazahId: jenazahId,
                last_used_date: now,
              });

              await manager.save(
                manager.create(InventoryTransaction, {
                  transaction_date: now,
                  transaction_type: InventoryTransactionType.STOCK_OUT,
                  reference_type: "JENAZAH_MODULE",
                  referenceId: jenazahId,
                  packageId,
                  package_name_snapshot: pkg.package_name,
                  itemId: pi.itemId,
                  item_name_snapshot: pi.item?.item_name ?? "",
                  quantity: -1,
                  before_quantity: 1,
                  after_quantity: 0,
                  assetId: asset.id,
                  asset_status: InventoryAssetStatus.IN_USE,
                  source: InventoryTransactionSource.JENAZAH_MODULE,
                  createdbyId: Number(ctx.user.id),
                }),
              );

              results.reusables.push({
                item_name: pi.item?.item_name ?? "",
                asset_number: asset.asset_number,
                status: InventoryAssetStatus.IN_USE,
              });
            });
          } catch (e: any) {
            results.errors.push(
              e.message ?? `Ralat memproses aset untuk ${pi.item?.item_name}`,
            );
          }
        }
      }

      return { success: true, packageId, jenazahId, results };
    }),

  // ── Return Asset (replaces returnEquipment Base44 function) ───────────────

  returnAsset: protectedProcedure
    .input(returnAssetSchema)
    .mutation(async ({ input, ctx }) => {
      const { assetId, jenazahId, condition, notes } = input;

      return await AppDataSource.transaction(async (manager) => {
        const asset = await manager.findOne(InventoryAsset, {
          where: { id: assetId },
          relations: ["item"],
        });

        if (!asset) throw new Error("Aset tidak dijumpai");
        if (asset.current_status !== InventoryAssetStatus.IN_USE) {
          throw new Error("Aset ini tidak sedang digunakan");
        }

        const prevStatus = asset.current_status;
        const now = new Date();

        // Map return condition to new asset status.
        const conditionStatusMap: Record<string, InventoryAssetStatus> = {
          GOOD: InventoryAssetStatus.AVAILABLE,
          DAMAGED: InventoryAssetStatus.MAINTENANCE,
          MISSING: InventoryAssetStatus.MISSING,
          MAINTENANCE: InventoryAssetStatus.MAINTENANCE,
        };
        const newStatus =
          conditionStatusMap[condition] ?? InventoryAssetStatus.AVAILABLE;

        await manager.update(InventoryAsset, assetId, {
          current_status: newStatus,
          assignedJenazahId: null,
          condition,
          last_used_date: now,
        });

        await manager.save(
          manager.create(InventoryTransaction, {
            transaction_date: now,
            transaction_type: InventoryTransactionType.RETURN,
            reference_type: "JENAZAH_MODULE",
            referenceId: jenazahId,
            itemId: asset.itemId,
            item_name_snapshot: asset.item?.item_name ?? "",
            quantity: 1,
            before_quantity: 0,
            after_quantity: 1,
            assetId: asset.id,
            asset_status: newStatus,
            source: InventoryTransactionSource.RETURN,
            notes: notes ?? `Dikembalikan dalam keadaan: ${condition}`,
            createdbyId: Number(ctx.user.id),
          }),
        );

        return {
          success: true,
          asset_number: asset.asset_number,
          previous_status: prevStatus,
          new_status: newStatus,
          condition,
        };
      });
    }),

  // ── Dashboard summary ──────────────────────────────────────────────────────

  getDashboardStats: protectedProcedure.query(async () => {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const assetRepo = AppDataSource.getRepository(InventoryAsset);

    const [totalItems, lowStockCount, outOfStockCount, assetsInUse] =
      await Promise.all([
        itemRepo.count(),
        itemRepo.count({ where: { status: InventoryItemStatus.LOW_STOCK } }),
        itemRepo.count({ where: { status: InventoryItemStatus.OUT_OF_STOCK } }),
        assetRepo.count({ where: { current_status: InventoryAssetStatus.IN_USE } }),
      ]);

    // Recent transactions (last 10).
    const recentTransactions = await AppDataSource.getRepository(
      InventoryTransaction,
    )
      .createQueryBuilder("tx")
      .leftJoinAndSelect("tx.item", "item")
      .orderBy("tx.transaction_date", "DESC")
      .take(10)
      .getMany();

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      assetsInUse,
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
        .where("tx.transaction_date >= :dateFrom", { dateFrom })
        .andWhere("tx.transaction_date <= :dateTo", { dateTo });

      if (filterType) {
        query.andWhere("tx.transaction_type = :type", { type: filterType });
      }

      return query.orderBy("tx.transaction_date", "DESC").getMany();
    }),
});
