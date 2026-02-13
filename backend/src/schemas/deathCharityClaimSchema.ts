import z from "zod";
import { ClaimStatus } from "../db/enums.ts";

export const deathCharityClaimSchema = z.object({
    deceasedname: z.string().min(1),
    relationship: z.string().optional().nullable(),
    payoutamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
    member: z.object({ id: z.number() }).nullable().optional(),
    deathcharity: z.object({ id: z.number() }).nullable().optional(),
    dependent: z.object({ id: z.number() }).nullable().optional(),
    status: z.enum(ClaimStatus).optional(),
});

export const claimFromMemberSchema = z.object({
    claims: z.array(
        z.object({
            deceasedname: z.string().min(1),
            relationship: z.string().min(1),
            payoutamount: z.number().refine((v) => Number.isFinite(v), "Invalid amount").nullable(),
            member: z.object({ id: z.number() }).nullable().optional(),
            deathcharity: z.object({ id: z.number() }).nullable().optional(),
            dependent: z.object({ id: z.number() }).nullable().optional(),
            status: z.enum(ClaimStatus).optional(),
        })
    ),
});