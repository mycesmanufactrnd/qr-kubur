// @ts-nocheck
import { z } from "zod";

export const deadPersonSchema = z.object({
  name: z.string().min(1, "Nama penuh diperlukan"),
  icnumber: z.string().nullable(),
  dateofbirth: z.string().or(z.date()).nullable().optional(),
  dateofdeath: z.string().or(z.date()).nullable().optional(),
  causeofdeath: z.string().nullable(),
  biography: z.string().nullable(),
  heirname: z.string().nullable().optional(),
  heirphoneno: z.string().nullable().optional(),
  photourl: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  grave: z.object({ id: z.number() }).optional(),
  gravelot: z.string().min(1, "Lot kubur diperlukan").nullable().optional(),
});
