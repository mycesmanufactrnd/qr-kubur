// schemas/deadPersonSchema.ts
import { z } from 'zod';

export const deadPersonSchema = z.object({
  name: z.string().min(1, "Nama penuh diperlukan"),
  icnumber: z.string().optional().nullable(),
  dateofbirth: z.string().or(z.date()).optional().nullable(),
  dateofdeath: z.string().or(z.date()).optional().nullable(),
  causeofdeath: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  photourl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  graveId: z.number().min(1, "Tanah perkuburan diperlukan"),
});