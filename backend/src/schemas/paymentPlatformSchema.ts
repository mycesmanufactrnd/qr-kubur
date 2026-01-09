import { z } from 'zod';

export const paymentPlatformSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    status: z.enum({
        ACTIVE: "active",
        INACTIVE: "inactive",
    }).optional(),
    icon: z.string().nullable().optional(),
});