// @ts-nocheck
import { z } from "zod";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryUnitType,
} from "../db/enums.js";

export const inventoryItemSchema = z.object({
  item_code: z.string().optional().nullable(),
  item_name: z.string().min(1, "Nama item diperlukan"),
  category: z.nativeEnum(InventoryItemCategory),
  item_type: z.nativeEnum(InventoryItemType),
  unit_type: z.nativeEnum(InventoryUnitType),
  current_quantity: z.number().int().nonnegative().default(0),
  minimum_level: z.number().int().nonnegative().default(0),
  maximum_level: z.number().int().nonnegative().optional().nullable(),
  unit_cost: z.number().nonnegative().optional().nullable(),
  status: z.nativeEnum(InventoryItemStatus).optional(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
