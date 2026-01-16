import { z } from 'zod';
import { VerificationStatus } from '../db/enums.ts';

export const donationSchema = z.object({
    donorname: z.string().nullable().optional(),
    donoremail: z.string().nullable().optional(),
    amount: z.number().nullable().optional(),
    recepienttype: z.string().min(1),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    organisation: z.object({ id: z.number() }).nullable().optional(),
    paymentplatform: z.object({ id: z.number() }).nullable().optional(),
    referenceno: z.string().nullable().optional(),  // fixed to match entity
    status: z.enum(VerificationStatus).optional(),  // left as-is
    notes: z.string().nullable().optional(),
});

export const donationApprovalSchema = z.object({
    status: z.enum(VerificationStatus).optional(),  // left as-is
});
