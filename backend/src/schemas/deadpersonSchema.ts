// schemas/deadPersonSchema.ts
import { z } from 'zod';

export const deadPersonSchema = z.object({
  name: z.string().min(1, "Nama penuh diperlukan"),
  icnumber: z.string().nullable(),
  dateofbirth: z.string().or(z.date()),
  dateofdeath: z.string().or(z.date()),
  causeofdeath: z.string().nullable(),
  biography: z.string().nullable(),
  photourl: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  graveId: z.number().min(1, "Tanah perkuburan diperlukan"),
});