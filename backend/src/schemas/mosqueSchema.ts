import { z } from 'zod';

export const mosqueSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  address: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  organisation: z.object({ id: z.number() }).nullable().optional(),
  photourl: z.string().optional().nullable(),
  picname: z.string().optional().nullable(),
  picphoneno: z.string().optional().nullable(),
  canarrangefuneral: z.boolean().default(false),
});