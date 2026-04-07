import { z } from 'zod';

export const mosqueSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  address: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  organisation: z.object({ id: z.number() }),
  photourl: z.string().optional().nullable(),
  picname: z.string().optional().nullable(),
  picphoneno: z.string().optional().nullable(),
  canarrangefuneral: z.boolean().default(false),
  hasdeathcharity: z.boolean().default(false),
});