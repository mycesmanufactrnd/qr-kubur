// @ts-nocheck
import { z } from "zod";

const cornerSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const graveBlockCreateSchema = z.object({
  graveId: z.number(),
  label: z.string().min(1),
  corners: z.array(cornerSchema).length(4),
  rows: z.number().int().min(1).max(50),
  cols: z.number().int().min(1).max(50),
});

export const graveBlockUpdateSchema = z.object({
  label: z.string().min(1),
  corners: z.array(cornerSchema).length(4),
});
