// @ts-nocheck
import { z } from "zod";

export const checkSessionSchema = z.object({
  location: z.string().min(1, "Lokasi diperlukan"),
  notes: z.string().optional().nullable(),
});

export const updateCheckDetailSchema = z.object({
  detailId: z.number().int().positive("ID baris diperlukan"),
  physical_count: z
    .number()
    .int()
    .nonnegative("Kiraan fizikal tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});
