import { z } from 'zod';
import { ApprovalStatus } from '../db/enums.ts';

export const suggestionSchema = z.object({
    type: z.string().min(1),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    organisation: z.object({ id: z.number() }).nullable().optional(),
    suggestedchanges: z.string().min(1),
    reason: z.string().min(1),
    status: z.enum(ApprovalStatus).optional(),
    adminnotes: z.string().optional().nullable(),
    visitorip: z.string().optional().nullable(),

});

export const suggestionApprovalSchema = z.object({
  status: z.enum(ApprovalStatus).optional(),
  adminnotes: z.string().nullable().optional(),
});
