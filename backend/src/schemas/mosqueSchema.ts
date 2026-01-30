import { z } from 'zod';

export const mosqueSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  organisationid: z.number().optional(),
});