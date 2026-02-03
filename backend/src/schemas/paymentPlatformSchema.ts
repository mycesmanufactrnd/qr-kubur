import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const paymentPlatformSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    status: z.enum(ActiveInactiveStatus).optional(),
});