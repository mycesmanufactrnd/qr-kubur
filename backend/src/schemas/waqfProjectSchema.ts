import { z } from 'zod';
import { ProjectStatus, WaqfCategory, WaqfType } from '../db/enums.ts';

export const waqfProjectSchema = z.object({
  waqfname: z.string().min(1, 'Waqf name is required'),
  description: z.string().nullable().optional(),
  category: z.enum(WaqfCategory).default(WaqfCategory.GENERALCHARITY),
  beneficiaries: z.string().nullable().optional(),
  startdate: z.coerce.date().nullable().optional(),
  enddate: z.coerce.date().nullable().optional(),
  status: z.enum(ProjectStatus).default(ProjectStatus.PLANNED),
  progresspercentage: z.number().min(0).max(100).default(0),
  totalrequired: z.number().positive('Total required must be greater than 0'),
  amountcollected: z.number().min(0).default(0),
  location: z.string().nullable().optional(),
  responsibleperson: z.string().nullable().optional(),
  waqftype: z.enum(WaqfType).nullable().optional(),
  photourl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
