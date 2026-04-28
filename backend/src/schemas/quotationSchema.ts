import { z } from "zod";
import { QuotationStatus } from "../db/enums.ts";

export const quotationSelectedServiceSchema = z.object({
  service: z.string().min(1),
  price: z.number().refine((v) => Number.isFinite(v), "Invalid amount").min(0),
});

export const quotationSchema = z.object({
  organisation: z.object({ id: z.number() }).nullable().optional(),
  deadperson: z.object({ id: z.number() }).nullable().optional(),
  grave: z.object({ id: z.number() }).nullable().optional(),
  selectedservices: z.array(quotationSelectedServiceSchema).min(1),
  referenceno: z.string().optional().nullable(),
  payername: z.string().optional().nullable(),
  payeremail: z.string().optional().nullable(),
  payerphone: z.string().optional().nullable(),
  serviceamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
  maintenancefeeamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
  totalamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
  status: z.enum(QuotationStatus).optional().default(QuotationStatus.PENDING),
  servicephotourl: z.string().optional().nullable(),
  servicedescription: z.string().optional().nullable(),
});
