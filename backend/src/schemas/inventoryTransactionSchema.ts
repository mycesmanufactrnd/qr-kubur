// @ts-nocheck
import { z } from "zod";
import { InventoryTransactionSource } from "../db/enums.js";

export const stockInSchema = z.object({
  itemId: z.number().int().positive("Item diperlukan"),
  quantity: z.number().int().positive("Kuantiti mesti lebih dari 0"),
  source: z.nativeEnum(InventoryTransactionSource).optional(),
  notes: z.string().optional().nullable(),
});

export const stockOutSchema = z.object({
  itemId: z.number().int().positive("Item diperlukan"),
  quantity: z.number().int().positive("Kuantiti mesti lebih dari 0"),
  reference_type: z.string().optional().nullable(),
  referenceId: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const adjustmentSchema = z.object({
  itemId: z.number().int().positive("Item diperlukan"),
  new_quantity: z.number().int().nonnegative("Kuantiti tidak boleh negatif"),
  notes: z.string().min(1, "Sebab pelarasan diperlukan"),
});

export const processPackageSchema = z.object({
  packageId: z.number().int().positive("Pakej diperlukan"),
  jenazahId: z.number().int().positive("ID jenazah diperlukan"),
});
