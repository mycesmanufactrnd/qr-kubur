import { router, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { RunningNo } from "../db/entities.ts";

export const runningNoRouter = router({
  createQuotationRunningNo: publicProcedure
    .mutation(async () => {
      return AppDataSource.transaction(async (manager) => {
        let running = await manager.findOne(RunningNo, { where: { id: 1 } });

        if (!running) {
          running = manager.create(RunningNo, { donation: 0, tahlil: 0, quotation: 0 });
          await manager.save(running);
        }

        running.quotation = (running.quotation || 0) + 1;
        await manager.save(running);

        return running.quotation;
      });
    }),

  createDonationRunningNo: publicProcedure
    .mutation(async () => {
      return AppDataSource.transaction(async (manager) => {
        let running = await manager.findOne(RunningNo, { where: { id: 1 } });

        if (!running) {
          running = manager.create(RunningNo, { donation: 0, tahlil: 0, quotation: 0 });
          await manager.save(running);
        }

        running.donation = (running.donation || 0) + 1;
        await manager.save(running);

        return running.donation;
      });
    }),

  createTahlilRunningNo: publicProcedure
    .mutation(async () => {
      return AppDataSource.transaction(async (manager) => {
        let running = await manager.findOne(RunningNo, { where: { id: 1 } });

        if (!running) {
          running = manager.create(RunningNo, { donation: 0, tahlil: 0, quotation: 0 });
          await manager.save(running);
        }

        running.tahlil = (running.tahlil || 0) + 1;
        await manager.save(running);

        return running.tahlil;
      });
    }),
});
