import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const organisationSchema = z.object({
  name: z.string().min(1),
  organisationtype: z.object({ id: z.number() }).nullable().optional(),
  parentorganisation: z.object({ id: z.number() }).nullable().optional(),
  states: z.array(z.string()).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  canbedonated: z.boolean().default(false),
  status: z.enum(ActiveInactiveStatus).optional(),
});
