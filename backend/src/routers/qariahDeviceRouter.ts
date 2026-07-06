// @ts-nocheck
import z from "zod";
import { publicProcedure, router } from "../trpc.js";
import { QariahDevice } from "../db/entities.js";
import { AppDataSource } from "../datasource.js";

export const qariahDeviceRouter = router({
  saveToken: publicProcedure
    .input(
      z.object({
        fcmQariahToken: z.string().min(1),
        icnumber: z.string().min(1),
        mosqueId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(QariahDevice);

      const existing = await repo.findOneBy({
        fcmQariahToken: input.fcmQariahToken,
      });

      // new qariah registration, update existing to new approval
      if (existing) {
        existing.icnumber = input.icnumber;
        existing.mosqueId = input.mosqueId ?? null;
        existing.isapproved = false;
        await repo.save(existing);
        return { success: true };
      }

      const device = repo.create({
        fcmQariahToken: input.fcmQariahToken,
        icnumber: input.icnumber,
        mosqueId: input.mosqueId ?? null,
        isapproved: false,
      });
      await repo.save(device);

      return { success: true };
    }),
});
