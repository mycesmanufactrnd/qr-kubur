import z from "zod";

export const deathCharityPaymentSchema = z.object({
    amount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
    paymenttype: z.string().min(1),
    paymentmethod: z.string().min(1),
    referenceno: z.string().optional().nullable(),
    coversfromyear: z.number().int(),
    coverstoyear: z.number().int(),
    member: z.object({ id: z.number() }).nullable().optional(),
});