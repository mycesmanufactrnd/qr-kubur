import { z } from "zod";
import { router, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import {
  DeathCharityPayment,
  Donation,
  Quotation,
  TahlilRequest,
} from "../db/entities.ts";

export const financialReportRouter = router({
  getByReferenceNo: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2000),
        month: z.number().int().min(1).max(12),
        checkRole: z.object({
          admin: z.boolean(),
          tahfiz: z.boolean(),
        }),
        currentUser: z.object({
          id: z.number(),
          organisation: z.object({ id: z.number() }).nullable(),
          tahfizcenter: z.object({ id: z.number() }).nullable(),
        }),
      }),
    )
    .query(async ({ input }) => {
      const { year, month, checkRole, currentUser } = input;

      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const donationRepo = AppDataSource.getRepository(Donation);
      const tahlilRepo = AppDataSource.getRepository(TahlilRequest);
      const deathCharityPaymentRepo = AppDataSource.getRepository(DeathCharityPayment);
      const quotationRepo = AppDataSource.getRepository(Quotation);

      let donations: Donation[] = [];
      let tahlils: TahlilRequest[] = [];
      let deathCharityPayments: DeathCharityPayment[] = [];
      let quotations: Quotation[] = [];

      if (checkRole.admin && currentUser.organisation) {
        const organisationId = currentUser.organisation.id;

        [donations, deathCharityPayments, quotations] = await Promise.all([
          donationRepo
            .createQueryBuilder("donation")
            .where("donation.createdat BETWEEN :start AND :end", {
              start: startDate,
              end: endDate,
            })
            .andWhere("donation.organisationId = :organisationId", {
              organisationId,
            })
            .getMany(),

          deathCharityPaymentRepo
            .createQueryBuilder("payment")
            .innerJoin("payment.member", "member")
            .innerJoin("member.deathcharity", "deathcharity")
            .where("payment.paidat BETWEEN :start AND :end", {
              start: startDate,
              end: endDate,
            })
            .andWhere("deathcharity.organisationId = :organisationId", {
              organisationId,
            })
            .getMany(),

          quotationRepo
            .createQueryBuilder("quotation")
            .where("quotation.createdat BETWEEN :start AND :end", {
              start: startDate,
              end: endDate,
            })
            .andWhere("quotation.organisationId = :organisationId", {
              organisationId,
            })
            .getMany(),
        ]);
      }

      if (checkRole.tahfiz && currentUser.tahfizcenter) {
        const tahfizcenterId = currentUser.tahfizcenter.id;

        const [tahfizDonations, tahfizTahlils] = await Promise.all([
          donationRepo
            .createQueryBuilder("donation")
            .where("donation.createdat BETWEEN :start AND :end", {
              start: startDate,
              end: endDate,
            })
            .andWhere("donation.tahfizcenterId = :tahfizcenterId", {
              tahfizcenterId,
            })
            .getMany(),

          tahlilRepo
            .createQueryBuilder("tahlil")
            .where("tahlil.createdat BETWEEN :start AND :end", {
              start: startDate,
              end: endDate,
            })
            .andWhere("tahlil.tahfizcenterId = :tahfizcenterId", {
              tahfizcenterId,
            })
            .getMany(),
        ]);

        donations = tahfizDonations;
        tahlils = tahfizTahlils;
      }

      return {
        donations,
        tahlils,
        deathCharityPayments,
        quotations,
      };
    }),
});
