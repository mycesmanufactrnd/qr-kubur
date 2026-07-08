// @ts-nocheck
import { z } from "zod";
import {
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemType,
  InventoryUnitType,
  CheckItemCondition,
} from "../db/enums.js";

export const inventoryItemSchema = z
  .object({
    item_code: z.string().optional().nullable(),
    item_name: z.string().min(1, "Nama item diperlukan"),
    category: z.nativeEnum(InventoryItemCategory),
    item_type: z.nativeEnum(InventoryItemType),
    unit_type: z.nativeEnum(InventoryUnitType).optional().nullable(),
    current_quantity: z.number().int().nonnegative().default(0),
    minimum_level: z.number().int().nonnegative().default(0),
    maximum_level: z.number().int().nonnegative().optional().nullable(),
    unit_cost: z.number().nonnegative().optional().nullable(),
    status: z.nativeEnum(InventoryItemStatus).optional(),
    condition: z.nativeEnum(CheckItemCondition).optional().nullable(),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    groupId: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => data.item_type !== InventoryItemType.ONE_TIME || !!data.unit_type,
    { message: "Unit diperlukan", path: ["unit_type"] },
  );
