// @ts-nocheck
import { z } from "zod";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryUnitType,
} from "../db/enums.js";

export const inventoryItemSchema = z.object({
  item_code: z.string().min(1, "Kod item diperlukan"),
  item_name: z.string().min(1, "Nama item diperlukan"),
  category: z.nativeEnum(InventoryItemCategory),
  item_type: z.nativeEnum(InventoryItemType),
  unit_type: z.nativeEnum(InventoryUnitType),
  current_quantity: z.number().int().nonnegative().default(0),
  minimum_stock_level: z.number().int().nonnegative().default(0),
  maximum_stock_level: z.number().int().nonnegative().default(0),
  storage_location: z.string().optional().nullable(),
  status: z.nativeEnum(InventoryItemStatus).optional(),
  description: z.string().optional().nullable(),
});
