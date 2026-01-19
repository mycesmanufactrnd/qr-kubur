import { z } from 'zod';
import { TahlilStatus } from '../db/enums.ts';

export const tahlilRequestSchema = z.object({
  requestorname: z.string().min(1),
  requestoremail: z.string().nullable(),
  requestorphoneno: z.string().min(1),
  deceasedname: z.array(z.string().min(1)).nullable().optional(),
  selectedservices: z.array(z.string().min(1)).nullable().optional(),
  referenceno: z.string().nullable().optional(),
  status: z.enum(TahlilStatus).optional(),
  tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
});

export const tahlilRequestApprovalSchema = z.object({
  status: z.enum(TahlilStatus).optional(),
});
