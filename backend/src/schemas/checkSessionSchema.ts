// @ts-nocheck
import { z } from "zod";
import { CheckItemCondition, CheckReusableStatus } from "../db/enums.js";

export const checkSessionSchema = z.object({
  location: z.string().min(1, "Lokasi diperlukan"),
  notes: z.string().optional().nullable(),
});

// Consumable items: audited by physical count.
export const updateCheckDetailSchema = z.object({
  detailId: z.number().int().positive("ID baris diperlukan"),
  physical_count: z
    .number()
    .int()
    .nonnegative("Kiraan fizikal tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

// Reusable items: audited by condition + status, no quantity.
export const updateReusableCheckDetailSchema = z.object({
  detailId: z.number().int().positive("ID baris diperlukan"),
  condition: z.nativeEnum(CheckItemCondition),
  reusable_status: z.nativeEnum(CheckReusableStatus),
  notes: z.string().optional().nullable(),
});
