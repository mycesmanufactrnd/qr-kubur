import { z } from 'zod';
import { ApprovalStatus } from '../db/enums.ts';

export const suggestionSchema = z.object({
    type: z.string().min(1),
    suggestedchanges: z.string().min(1),
    reason: z.string().min(1),
    status: z.enum(ApprovalStatus).optional(),
    visitorip: z.string().optional().nullable(),

});

export const suggestionApprovalSchema = z.object({
  status: z.enum(ApprovalStatus).optional(),
  adminnotes: z.string().nullable().optional(),
});
