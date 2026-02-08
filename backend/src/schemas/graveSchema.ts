import { z } from 'zod';
import { GraveStatus } from '../db/enums.ts';

export const graveSchema = z.object({
  name: z.string().min(1, "Nama tanah perkuburan diperlukan"),
  state: z.string().min(1, "Negeri diperlukan"),
  block: z.string().optional().nullable(),
  lot: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  photourl: z.string().optional().nullable(),
  picname: z.string().optional().nullable(),
  picphoneno: z.string().optional().nullable(),
  totalgraves: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(GraveStatus),
  organisation: z.object({ id: z.number() }).nullable().optional(),
});