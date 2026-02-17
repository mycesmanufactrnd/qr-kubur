import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { AppDataSource } from '../datasource.ts';
import { IslamicEvent } from '../db/entities.ts';
import moment from 'moment-hijri';
import z from 'zod';
import { eventSchema } from '../schemas/eventSchema.ts';

export const islamicEventRouter = router({
  getEventsByHijriYear: publicProcedure.query(async () => {
    const currentHijriYear = moment().iYear();

    const events = await AppDataSource.getRepository(IslamicEvent).find({
      order: { hijrimonth: 'ASC', hijriday: 'ASC' }
    });

    return events;
  }),

  create: protectedProcedure
    .input(eventSchema)
    .mutation(async ({ input }) => {
      const eventRepo = AppDataSource.getRepository(IslamicEvent);

      const event = eventRepo.create(input);
      
      return await eventRepo.save(event);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: eventSchema }))
    .mutation(async ({ input }) => {
      const eventRepo = AppDataSource.getRepository(IslamicEvent);
      const event = await eventRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      eventRepo.merge(event, cleanedInput);

      return await eventRepo.save(event);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const eventRepo = AppDataSource.getRepository(IslamicEvent);
      return await eventRepo.delete(input);
    }),
});
