import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const tahfizSchema = z.object({
  name: z.string().min(1),
  // Synchronized with Entity: no underscores
  serviceoffered: z.array(z.string()).optional(),
  serviceprice: z.object({}).catchall(z.number()).optional(),
  state: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
  // Ensure these are named latitude/longitude
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.enum(ActiveInactiveStatus).optional(),
});