import { z } from "zod";

export const collectionTreeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  organisation: z.object({ id: z.number() }).nullable().optional(),
});

export const collectionTreeItemSchema = z.object({
  collectionTreeId: z.number(),
  graveId: z.number().nullable().optional(),
  mosqueId: z.number().nullable().optional(),
  tahfizId: z.number().nullable().optional(),
  organisationId: z.number().nullable().optional(),
});
