import { z } from 'zod';
import { ActiveInactiveStatus } from '../db/enums.ts';

export const organisationServiceOfferedSchema = z.object({
  id: z.number().optional(),
  service: z.string().min(1),
  price: z.number().min(0),
  isactive: z.boolean().optional().default(true),
  organisation: z.object({ id: z.number() }).nullable().optional(),
  tahfizcenter: z.object({ id: z.number() }).nullable().optional(),
}).refine(
  (value) => {
    const hasOrganisation = !!value.organisation?.id;
    const hasTahfiz = !!value.tahfizcenter?.id;
    return !(hasOrganisation && hasTahfiz);
  },
  {
    message: 'Service cannot belong to both organisation and tahfizcenter at the same time',
    path: ['organisation'],
  }
);

export const organisationSchema = z.object({
  name: z.string().min(1),
  organisationtype: z.object({ id: z.number() }).nullable().optional(),
  parentorganisation: z.object({ id: z.number() }).nullable().optional(),
  services: z.array(organisationServiceOfferedSchema).optional(),
  states: z.array(z.string()).optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  photourl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  canbedonated: z.boolean().default(false),
  canmanagemosque: z.boolean().default(false),
  isgraveservices: z.boolean().default(false),
  status: z.enum(ActiveInactiveStatus).optional(),
});
