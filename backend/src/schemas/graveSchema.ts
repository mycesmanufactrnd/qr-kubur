import { z } from 'zod';

export const graveSchema = z.object({
  name: z.string().min(1, "Nama tanah perkuburan diperlukan"),
  state: z.string().min(1, "Negeri diperlukan"),
  block: z.string().optional().nullable(),
  lot: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  icnumber: z.string().optional().nullable(),
  totalgraves: z.number().int().nonnegative().optional().nullable(),
  status: z.string().optional().nullable(),
  organisationid: z.number().optional().nullable(),
});