import { z } from 'zod';

export const paymentFieldSchema = z.object({
    code: z.string().min(1),
    key: z.string().min(1),
    label: z.string().min(1),
    fieldtype: z.string().min(1),
    required: z.boolean().default(true),
    placeholderv: z.string().optional().nullable(),
});