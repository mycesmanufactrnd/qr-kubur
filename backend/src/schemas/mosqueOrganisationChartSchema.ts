// @ts-nocheck
import { z } from "zod";

export const mosqueOrganisationChartSchema = z.object({
  mosque: z.object({ id: z.number() }),
  team: z.string().min(1),
  name: z.string().min(1),
  phoneno: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
});
