import { z } from 'zod';
import { VerificationStatus } from '../db/enums.ts';

export const donationSchema = z.object({
    donorname: z.string().nullable(),
    donoremail: z.string().nullable(),
    donorphoneno: z.string().nullable(),
    amount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").positive().nullable(),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    organisation: z.object({ id: z.number() }).nullable().optional(),
    status: z.enum(VerificationStatus).optional(),
    notes: z.string().nullable(),
});

export const donationApprovalSchema = z.object({
    status: z.enum(VerificationStatus).optional(), 
});