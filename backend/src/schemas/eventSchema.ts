import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["Event", "Fasting", "Prayer", "Hajj"]),
  hijrimonth: z.number().min(1).max(12).default(1),
  hijriday: z.number().min(1).max(30).default(1),
  description: z.string().optional().nullable(),
  virtue: z.string().optional().nullable(),
  recommendedamal: z.array(z.string()).optional(), 
  quranreference: z.string().optional().nullable(),
  hadithreference: z.string().optional().nullable(),
  isactive: z.boolean().default(true),
  isrecurring: z.boolean().default(true),
  reminderdaysbefore: z.number().min(0).default(1),
});