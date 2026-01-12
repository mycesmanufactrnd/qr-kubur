import z from "zod";
import { AppDataSource } from "../datasource.ts";
import { PaymentPlatform } from "../db/entities/PaymentPlatform.entity.ts";
import { protectedProcedure, router, superAdminProcedure } from "../trpc.ts";
import { paymentPlatformSchema } from "../schemas/paymentPlatformSchema.ts";
import { ActiveInactiveStatus } from "../db/enums.ts";

export const paymentPlatformRouter = router({
  getPlatform: superAdminProcedure
    .query(() => {
      const platformRepo = AppDataSource.getRepository(PaymentPlatform);

      return platformRepo.find();
    }),

  getActivePlatform: protectedProcedure
    .query(() => {
      const platformRepo = AppDataSource.getRepository(PaymentPlatform);

      return platformRepo.find({
        where: { status: ActiveInactiveStatus.ACTIVE },
        relations: ['paymentfields']
      });
    }),

  create: superAdminProcedure
      .input(paymentPlatformSchema)
      .mutation(async ({ input }) => {
        const platformRepo = AppDataSource.getRepository(PaymentPlatform);
  
        const platform = platformRepo.create(input);
  
        return await platformRepo.save(platform);
      }),
  
  update: superAdminProcedure
    .input(z.object({ id: z.number(), data: paymentPlatformSchema }))
    .mutation(async ({ input }) => {
      const platformRepo = AppDataSource.getRepository(PaymentPlatform);
      const platform = await platformRepo.findOneByOrFail({ id: input.id });

      platformRepo.merge(platform, input.data);

      return await platformRepo.save(platform);
    }),

  delete: superAdminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const platformRepo = AppDataSource.getRepository(PaymentPlatform);
      return platformRepo.delete(input);
    }),
});