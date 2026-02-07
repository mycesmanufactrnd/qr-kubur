import { z } from 'zod';

export const activityPostSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    photourl: z.string().optional().nullable(),
    ispublished: z.boolean().default(false),
    mosqueId: z.number().nullable().optional(), 
    tahfizId: z.number().nullable().optional(),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    mosque: z.object({ id: z.number() }).nullable().optional(),
});