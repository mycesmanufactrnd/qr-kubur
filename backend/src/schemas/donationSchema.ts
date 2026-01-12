import { z } from 'zod';
import { VerificationStatus } from '../db/enums.ts';

export const donationSchema = z.object({
    donorname: z.string().nullable(),
    donoremail: z.string().nullable(),
    amount: z.number().nullable(),
    recepienttype: z.string().min(1),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    organisation: z.object({ id: z.number() }).nullable().optional(),
    paymentplatform: z.object({ id: z.number() }).nullable().optional(),
    referenceno: z.number().nullable(),
    status: z.enum(VerificationStatus).optional(),
    notes: z.string().nullable(),

});

export const donationApprovalSchema = z.object({
  status: z.enum(VerificationStatus).optional(),
});
