import z from "zod";

export const deathCharityMemberSchema = z.object({
    fullname: z.string().min(1),
    icnumber: z.string().min(1),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    isactive: z.boolean().default(true),
    deathcharity: z.object({ id: z.number() }).nullable().optional(),
});
