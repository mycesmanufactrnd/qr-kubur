// @ts-nocheck
import { protectedProcedure, router } from "../trpc.js";
import { InventoryAsset } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";
import { z } from "zod";
import { inventoryAssetSchema } from "../schemas/inventoryAssetSchema.js";
import { InventoryAssetCondition, InventoryAssetStatus } from "../db/enums.js";
import { TRPCError } from "@trpc/server";

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  id: "asset.id",
  asset_number: "asset.asset_number",
  current_status: "asset.current_status",
  condition: "asset.condition",
  last_used_date: "asset.last_used_date",
  createdat: "asset.createdat",
};

export const inventoryAssetRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterItemId: z.number().int().positive().optional(),
        filterStatus: z.nativeEnum(InventoryAssetStatus).optional(),
        filterCondition: z.nativeEnum(InventoryAssetCondition).optional(),
        filterAssetNumber: z.string().optional(),
        sortField: z.string().optional(),
        sortOrder: z.enum(["ASC", "DESC"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterItemId,
        filterStatus,
        filterCondition,
        filterAssetNumber,
        sortField,
        sortOrder,
      } = input;

      const repo = AppDataSource.getRepository(InventoryAsset);
      const query = repo
        .createQueryBuilder("asset")
        .leftJoinAndSelect("asset.item", "item")
        .leftJoinAndSelect("asset.assignedJenazah", "assignedJenazah");

      if (filterItemId) {
        query.andWhere("asset.itemId = :itemId", { itemId: filterItemId });
      }

      if (filterStatus) {
        query.andWhere("asset.current_status = :status", {
          status: filterStatus,
        });
      }

      if (filterCondition) {
        query.andWhere("asset.condition = :condition", { condition: filterCondition });
      }

      if (filterAssetNumber) {
        query.andWhere("asset.asset_number ILIKE :assetNumber", {
          assetNumber: `%${filterAssetNumber}%`,
        });
      }

      const orderCol =
        ALLOWED_SORT_FIELDS[sortField ?? "id"] ?? "asset.id";
      const orderDir = sortOrder ?? "DESC";

      const [items, total] = await query
        .orderBy(orderCol, orderDir)
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return { items, total };
    }),

  getInUse: protectedProcedure.query(async () => {
    return await AppDataSource.getRepository(InventoryAsset).find({
      where: { current_status: InventoryAssetStatus.IN_USE },
      relations: ["item", "assignedJenazah"],
      order: { last_used_date: "DESC" },
    });
  }),

  create: protectedProcedure
    .input(inventoryAssetSchema)
    .mutation(async ({ input, ctx }) => {
      const repo = AppDataSource.getRepository(InventoryAsset);
      const asset = repo.create({
        ...input,
        createdbyId: Number(ctx.user.id),
      });
      return await repo.save(asset);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: inventoryAssetSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(InventoryAsset);
      const asset = await repo.findOneByOrFail({ id: input.id });

      const cleanedData = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      repo.merge(asset, cleanedData);
      return await repo.save(asset);
    }),

  delete: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(InventoryAsset);
      const asset = await repo.findOneByOrFail({ id: input });

      if (asset.current_status === InventoryAssetStatus.IN_USE) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Tidak boleh padam aset yang sedang digunakan. Kembalikan aset dahulu.",
        });
      }

      return await repo.delete(input);
    }),
});
