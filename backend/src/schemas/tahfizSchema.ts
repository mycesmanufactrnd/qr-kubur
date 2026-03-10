import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const tahfizServiceOfferedSchema = z.object({
  id: z.number().optional(),
  service: z.string().min(1),
  price: z.number().min(0),
  tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
});

export const tahfizSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  services: z.array(tahfizServiceOfferedSchema).optional(),
  state: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  status: z.enum(ActiveInactiveStatus).optional(),
  photourl: z.string().optional().nullable(),
});

