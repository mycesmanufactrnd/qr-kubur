// @ts-nocheck
import z from "zod";
import { publicProcedure, router } from "../trpc.js";
import { KariahDevice } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";

export const kariahDeviceRouter = router({
  saveToken: publicProcedure
    .input(
      z.object({
        fcmKariahToken: z.string().min(1),
        icnumber: z.string().min(1),
        mosqueId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(KariahDevice);

      const existing = await repo.findOneBy({
        fcmKariahToken: input.fcmKariahToken,
      });

      // new kariah registration, update existing to new approval
      if (existing) {
        existing.icnumber = input.icnumber;
        existing.mosqueId = input.mosqueId ?? null;
        existing.isapproved = false;
        await repo.save(existing);
        return { success: true };
      }

      const device = repo.create({
        fcmKariahToken: input.fcmKariahToken,
        icnumber: input.icnumber,
        mosqueId: input.mosqueId ?? null,
        isapproved: false,
      });
      await repo.save(device);

      return { success: true };
    }),
});
