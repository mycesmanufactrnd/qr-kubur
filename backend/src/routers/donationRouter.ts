import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { Donation, GoogleUserRecord, OnlineTransaction } from "../db/entities.ts";
import {
  donationSchema,
  donationApprovalSchema,
} from "../schemas/donationSchema.ts";

export const donationRouter = router({
  getByReferenceNo: publicProcedure
    .input(z.object({ referenceno: z.string() }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Donation);
      return repo.findOne({
        where: { referenceno: input.referenceno },
        relations: ["organisation", "tahfizcenter"],
      });
    }),

  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).optional(),
        currentUser: z.object({
          id: z.number(),
          organisation: z.object({ id: z.number() }).nullable(),
          tahfizcenter: z.object({ id: z.number() }).nullable(),
        }),
        checkRole: z
          .object({
            superadmin: z.boolean(),
            admin: z.boolean(),
            employee: z.boolean(),
            tahfiz: z.boolean(),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page = 1, pageSize = 10, currentUser, checkRole } = input;

      const donationRepo = AppDataSource.getRepository(Donation);
      const query = donationRepo.createQueryBuilder("donation");

      if (checkRole?.superadmin) {
        query
          .leftJoinAndSelect("donation.organisation", "organisation")
          .leftJoinAndSelect("donation.tahfizcenter", "tahfizcenter");
      } else {
        if (currentUser.tahfizcenter) {
          query
            .leftJoinAndSelect("donation.organisation", "organisation")
            .andWhere("donation.tahfizcenterId = :tahfizId", {
              tahfizId: currentUser.tahfizcenter.id,
            });
        }
        if (currentUser.organisation) {
          query
            .leftJoinAndSelect("donation.tahfizcenter", "tahfizcenter")
            .andWhere("donation.organisationId = :orgId", {
              orgId: currentUser.organisation.id,
            });
        }
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const [items, total] = await query
        .orderBy("donation.createdat", "DESC")
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(
      donationSchema.extend({
        googleuserId: z.number().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const donationRepo = AppDataSource.getRepository(Donation);
      const donation = donationRepo.create(input);
      const savedDonation = await donationRepo.save(donation);

      if (input.googleuserId) {
        const userRecordRepo = AppDataSource.getRepository(GoogleUserRecord);
        const record = userRecordRepo.create({
          entityname: "donation",
          entityid: savedDonation.id,
          referenceno: savedDonation.referenceno,
          status: savedDonation.status,
          googleuser: { id: input.googleuserId },
        });

        await userRecordRepo.save(record);
      }

      return savedDonation;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: donationApprovalSchema }))
    .mutation(async ({ input }) => {
      const donationRepo = AppDataSource.getRepository(Donation);
      const donation = await donationRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined),
      );

      donationRepo.merge(donation, cleanedInput);
      return donationRepo.save(donation);
    }),
});
