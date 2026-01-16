import { z } from 'zod';
import { TahlilStatus } from '../db/enums.ts';

export const tahlilRequestSchema = z.object({
  requestorname: z.string().min(1),
  requestoremail: z.string().email().optional().nullable(),
  requestorphoneno: z.string().min(1),
  deceasednames: z.array(z.string().min(1)).nullable().optional(),
  selectedservices: z.array(z.string().min(1)).nullable().optional(),
  referenceno: z.string().nullable().optional(),
  status: z.enum(TahlilStatus).optional().default(TahlilStatus.PENDING),
  tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
  preferreddate: z.string().optional().nullable().transform((str) => (str ? new Date(str) : undefined)),
  notes: z.string().optional().nullable(),
});

export const tahlilRequestApprovalSchema = z.object({
  status: z.enum(TahlilStatus),
});
