import { z } from 'zod';

export const userSchema = z.object({
    fullname: z.string().min(1),
    email: z.string().optional(),
    phoneno: z.string().optional(),
    password: z.string().min(1),
    role: z.string().min(1),
    states: z.array(z.string()).optional(),
    organisation: z.object({ id: z.number() }).nullable().optional(),
    tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
    mosque: z.object({ id: z.number() }).nullable().optional(),
});

export const updateUserSchema = userSchema.partial().extend({
  password: z.string().min(1).optional(),
});