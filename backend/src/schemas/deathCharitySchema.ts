import z from "zod";

export const deathCharitySchema = z.object({
    name: z.string().min(1),
    state: z.string().min(1),
    description: z.string().nullable(),
    contactperson: z.string().min(1),
    contactphone: z.string().min(1),
    registrationfee: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
    monthlyfee: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
    deathbenefitamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
    coversspouse: z.boolean().default(true),
    coverschildren: z.boolean().default(true),
    maxdependents: z.number().int().min(0).default(0),
    isactive: z.boolean().default(true),
    organisation: z.object({ id: z.number() }).nullable().optional(),
});