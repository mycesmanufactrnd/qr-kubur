import { z } from 'zod';
import { TahlilStatus } from '../db/enums.ts';

export const tahlilRequestSchema = z.object({
  requestorname: z.string().optional().nullable(),
  requestorphoneno: z.string().optional().nullable(),
  requestoremail: z.string().optional().nullable(),
  deceasednames: z.array(z.string()).optional().nullable(),
  selectedservices: z.array(z.string()).optional().nullable(),
  tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
  customservice: z.string().optional().nullable(),
  referenceno: z.string().optional().nullable(),
  serviceamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
  platformfeeamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
  status: z.enum(TahlilStatus).optional().default(TahlilStatus.PENDING),
  photourls: z.array(z.string()).optional().nullable(),
});

export const tahlilRequestApprovalSchema = z.object({
  status: z.enum(TahlilStatus),
  suggesteddate: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.coerce.date().nullable().optional(),
  ),
  photourls: z.array(z.string()).optional().nullable(),
});

export const tahlilRequestLiveURL = z.object({
  liveurl: z.string().nullable(),
});
