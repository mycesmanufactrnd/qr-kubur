// @ts-nocheck
import { z } from "zod";
import { InventoryAssetCondition, InventoryAssetStatus } from "../db/enums.js";

export const inventoryAssetSchema = z.object({
  asset_number: z.string().optional().nullable(),
  itemId: z.number().int().positive("Item diperlukan"),
  current_status: z.nativeEnum(InventoryAssetStatus).optional(),
  condition: z.nativeEnum(InventoryAssetCondition).optional(),
  assigned_to: z.string().optional().nullable(),
  last_used_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const returnAssetSchema = z.object({
  assetId: z.number().int().positive("ID aset diperlukan"),
  jenazahId: z.number().int().positive("ID jenazah diperlukan"),
  condition: z.nativeEnum(InventoryAssetCondition),
  notes: z.string().optional().nullable(),
});
