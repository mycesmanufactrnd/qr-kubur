import { z } from 'zod';

export const heritageSchema = z.object({
    name: z.string().min(1, "Nama tanah perkuburan diperlukan"),
    era: z.string().optional().nullable(),
    eradescription: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    historicalsources: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    photourl: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    state: z.string().min(1, "Negeri diperlukan"),
    url: z.string().optional().nullable(),
    viewcount: z.number().default(0),
    isfeatured: z.boolean().default(false),
});