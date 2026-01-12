import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const organisationSchema = z.object({
  name: z.string().min(1),

  organisationtype: z.object({ id: z.number() }).nullable().optional(),
  parentorganisation: z.object({ id: z.number() }).nullable().optional(),

  states: z.array(z.string()).optional(),

  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),

  status: z.enum(ActiveInactiveStatus).optional(),
});
