// @ts-nocheck
import { z } from "zod";
import {
  ActiveInactiveStatus,
  InventoryItemType,
  InventoryPackageAgeGroup,
  InventoryPackageBodySize,
  InventoryPackageGenderType,
  InventoryPackageHealthCondition,
} from "../db/enums.js";

export const packageItemSchema = z.object({
  itemId: z.number().int().positive("Item diperlukan"),
  quantity_required: z.number().int().positive("Kuantiti mesti lebih dari 0"),
  item_type: z.nativeEnum(InventoryItemType),
});

export const inventoryPackageSchema = z.object({
  package_name: z.string().min(1, "Nama pakej diperlukan"),
  description: z.string().optional().nullable(),
  gender_type: z.nativeEnum(InventoryPackageGenderType),
  age_group: z.nativeEnum(InventoryPackageAgeGroup),
  health_condition: z.nativeEnum(InventoryPackageHealthCondition),
  body_size: z.nativeEnum(InventoryPackageBodySize).optional().nullable(),
  status: z.nativeEnum(ActiveInactiveStatus).optional(),
  packageItems: z
    .array(packageItemSchema)
    .min(1, "Pakej mesti ada sekurang-kurangnya satu item"),
});
