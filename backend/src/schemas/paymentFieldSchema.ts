import { z } from 'zod';

export const paymentFieldSchema = z.object({
    paymentplatform: z.object({ id: z.number() }).nullable().optional(),
    key: z.string().min(1),
    label: z.string().min(1),
    fieldtype: z.string().min(1),
    required: z.boolean().default(true),
    placeholder: z.string().optional().nullable(),
});