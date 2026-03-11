import { z } from "zod";
import { ActiveInactiveStatus, ApprovalStatus } from "../db/enums.ts";

export const allowedTempOrganisationTypeNames = [
  "Syarikat Swasta",
  "Pertubuhan Kebajikan (NGO)",
  "Persatuan Sukarelawan",
] as const;

export const tempOrganisationRegisterSchema = z.object({
  name: z.string().min(1),
  organisationtypeid: z.number().int().positive(),
  agreeServiceTerms: z.boolean().refine((value) => value === true, {
    message: "Service agreement must be accepted",
  }),
  states: z.array(z.string().min(1)).min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  canbedonated: z.boolean().default(false),
  canmanagemosque: z.boolean().default(false),
  isgraveservices: z.boolean().default(false),
  serviceoffered: z.array(z.string()).optional(),
  serviceprice: z.record(z.string(), z.number()).optional(),
  paymentconfigdraft: z.array(z.object({
    paymentPlatformId: z.number().int().positive(),
    paymentFieldId: z.number().int().positive(),
    value: z.string().min(1),
  })).optional(),
  contactname: z.string().min(1),
  contactemail: z.string(),
  contactphoneno: z.string().optional().nullable(),
  status: z.enum(ActiveInactiveStatus).default(ActiveInactiveStatus.ACTIVE),
});

export const tempOrganisationFilterSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).default(10),
  filterName: z.string().optional(),
  filterStatus: z.enum(ApprovalStatus).optional(),
});

export const tempOrganisationReviewSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(["approved", "rejected"]),
  reviewnote: z.string().optional().nullable(),
});
