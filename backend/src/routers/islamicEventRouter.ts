// @ts-nocheck
import { protectedProcedure, publicProcedure, router } from "../trpc.js";
import { AppDataSource } from "../datasource.js";
import { IslamicEvent } from "../db/entities.js";
import moment from "moment-hijri";
import z from "zod";
import { eventSchema } from "../schemas/eventSchema.js";

export const islamicEventRouter = router({
  getEventsByHijriYear: publicProcedure.query(async () => {
    const currentHijriYear = moment().iYear();

    const events = await AppDataSource.getRepository(IslamicEvent).find({
      order: { hijrimonth: "ASC", hijriday: "ASC" },
    });

    return events;
  }),

  create: protectedProcedure.input(eventSchema).mutation(async ({ input }) => {
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
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      eventRepo.merge(event, cleanedInput);

      return await eventRepo.save(event);
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const eventRepo = AppDataSource.getRepository(IslamicEvent);
    return await eventRepo.delete(input);
  }),

  // Pulls the recurring Hijri "special days" list from Aladhan and upserts them —
  // matched by (hijrimonth, hijriday, title) since the API has no stable id.
  syncFromAladhan: protectedProcedure.mutation(async () => {
    const res = await fetch("https://api.aladhan.com/v1/specialDays");
    if (!res.ok) throw new Error("Failed to fetch special days from Aladhan");

    const json = await res.json();
    const specialDays = Array.isArray(json?.data) ? json.data : [];

    const eventRepo = AppDataSource.getRepository(IslamicEvent);
    let created = 0;
    let updated = 0;

    for (const day of specialDays) {
      const hijrimonth = Number(day.month);
      const hijriday = Number(day.day);
      const title = String(day.name || "").trim();
      if (!title || !hijrimonth || !hijriday) continue;

      const existing = await eventRepo.findOne({
        where: { hijrimonth, hijriday, title },
      });

      if (existing) {
        await eventRepo.save(existing);
        updated++;
      } else {
        const event = eventRepo.create({
          title,
          hijrimonth,
          hijriday,
          isrecurring: true,
          isactive: true,
          reminderdaysbefore: 1,
        });
        await eventRepo.save(event);
        created++;
      }
    }

    return { total: specialDays.length, created, updated };
  }),
});
