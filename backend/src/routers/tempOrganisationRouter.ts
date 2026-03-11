import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { In } from "typeorm";
import { adminProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import {
  Organisation,
  OrganisationType,
  OrganisationPaymentConfig,
  Permission,
  ServiceOffered,
  TempOrganisation,
  User,
} from "../db/entities.ts";
import { buildDefaultPermissions } from "../helpers/authHelper.ts";
import { ApprovalStatus, ActiveInactiveStatus } from "../db/enums.ts";
import {
  allowedTempOrganisationTypeNames,
  tempOrganisationFilterSchema,
  tempOrganisationRegisterSchema,
  tempOrganisationReviewSchema,
} from "../schemas/tempOrganisationSchema.ts";

const hashPassword = (plainPassword: string) => {
  return crypto.createHash("sha256").update(plainPassword).digest("hex");
};

const normalizeServiceData = (
  serviceoffered?: string[],
  serviceprice?: Record<string, number>,
) => {
  const cleanedServices: string[] = [];
  const cleanedServicePrice: Record<string, number> = {};
  const seen = new Set<string>();

  for (const rawService of serviceoffered ?? []) {
    const service = (rawService ?? "").trim();
    if (!service) continue;

    const key = service.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    cleanedServices.push(service);
    cleanedServicePrice[service] = Number(
      Number(serviceprice?.[service] ?? 0).toFixed(2),
    );
  }

  return {
    serviceoffered: cleanedServices,
    serviceprice: cleanedServicePrice,
  };
};

export const tempOrganisationRouter = router({
  getAllowedOrganisationTypes: publicProcedure.query(async () => {
    const repo = AppDataSource.getRepository(OrganisationType);

    return repo.find({
      where: {
        name: In([...allowedTempOrganisationTypeNames]),
        status: ActiveInactiveStatus.ACTIVE,
      },
      order: { id: "ASC" },
    });
  }),

  register: publicProcedure
    .input(tempOrganisationRegisterSchema)
    .mutation(async ({ input }) => {
      const orgTypeRepo = AppDataSource.getRepository(OrganisationType);
      const tempOrganisationRepo = AppDataSource.getRepository(TempOrganisation);

      const organisationtype = await orgTypeRepo.findOne({
        where: {
          id: input.organisationtypeid,
          name: In([...allowedTempOrganisationTypeNames]),
          status: ActiveInactiveStatus.ACTIVE,
        },
      });

      if (!organisationtype) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid organisation type selection",
        });
      }

      const normalizedServices = normalizeServiceData(
        input.serviceoffered,
        input.serviceprice,
      );

      const tempOrganisationData: Partial<TempOrganisation> = {
        name: input.name.trim(),
        organisationtype: { id: organisationtype.id },
        states: (input.states ?? []).map((state) => state.trim()).filter(Boolean),
        address: input.address ?? undefined,
        phone: input.phone ?? undefined,
        email: input.email?.trim() || undefined,
        url: input.url?.trim() || undefined,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
        canbedonated: !!input.canbedonated,
        canmanagemosque: !!input.canmanagemosque,
        isgraveservices: !!input.isgraveservices,
        serviceoffered: input.isgraveservices
          ? normalizedServices.serviceoffered
          : [],
        serviceprice: input.isgraveservices
          ? normalizedServices.serviceprice
          : {},
        paymentconfigdraft: input.paymentconfigdraft ?? undefined,
        contactname: input.contactname.trim(),
        contactemail: input.contactemail.trim().toLowerCase(),
        contactphoneno: input.contactphoneno?.trim() || undefined,
        status: input.status ?? ActiveInactiveStatus.ACTIVE,
        approvalstatus: ApprovalStatus.PENDING,
      };

      const tempOrganisation = tempOrganisationRepo.create(tempOrganisationData);
      return tempOrganisationRepo.save(tempOrganisation);
    }),

  getPaginated: adminProcedure
    .input(tempOrganisationFilterSchema)
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(TempOrganisation);
      const query = repo
        .createQueryBuilder("temporganisation")
        .leftJoinAndSelect("temporganisation.organisationtype", "organisationtype");

      if (input.filterName?.trim()) {
        query.andWhere("temporganisation.name ILIKE :name", {
          name: `%${input.filterName.trim()}%`,
        });
      }

      if (input.filterStatus) {
        query.andWhere("temporganisation.approvalstatus = :status", {
          status: input.filterStatus,
        });
      }

      query.skip((input.page - 1) * input.pageSize).take(input.pageSize);

      const [items, total] = await query
        .orderBy("temporganisation.createdat", "DESC")
        .getManyAndCount();

      return { items, total };
    }),

  review: adminProcedure
    .input(tempOrganisationReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const reviewerId = Number(ctx.user?.id);
      if (!reviewerId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid reviewer session",
        });
      }

      return AppDataSource.transaction(async (manager) => {
        const tempOrganisationRepo = manager.getRepository(TempOrganisation);
        const organisationRepo = manager.getRepository(Organisation);
        const userRepo = manager.getRepository(User);
        const permissionRepo = manager.getRepository(Permission);
        const serviceRepo = manager.getRepository(ServiceOffered);
        const paymentConfigRepo = manager.getRepository(OrganisationPaymentConfig);

        const tempOrganisation = await tempOrganisationRepo.findOne({
          where: { id: input.id },
          relations: ["organisationtype"],
        });

        if (!tempOrganisation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Temporary organisation not found",
          });
        }

        if (tempOrganisation.approvalstatus !== ApprovalStatus.PENDING) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This registration has already been reviewed",
          });
        }

        tempOrganisation.reviewnote = input.reviewnote?.trim() || undefined;
        tempOrganisation.reviewedbyuserid = reviewerId;
        tempOrganisation.reviewedat = new Date();

        if (input.action === "rejected") {
          tempOrganisation.approvalstatus = ApprovalStatus.REJECTED;
          return tempOrganisationRepo.save(tempOrganisation);
        }

        if (!tempOrganisation.organisationtype?.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing organisation type on submission",
          });
        }

        const adminEmail = (tempOrganisation.contactemail ?? "").trim().toLowerCase();
        if (!adminEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing contact email for temporary admin account",
          });
        }

        const existingUser = await userRepo.findOne({
          where: { email: adminEmail },
        });
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A user with this contact email already exists",
          });
        }

        const newOrganisation = organisationRepo.create({
          name: tempOrganisation.name,
          organisationtype: { id: tempOrganisation.organisationtype.id },
          states: tempOrganisation.states ?? [],
          address: tempOrganisation.address ?? undefined,
          phone: tempOrganisation.phone ?? undefined,
          email: tempOrganisation.email ?? adminEmail,
          url: tempOrganisation.url ?? undefined,
          latitude: tempOrganisation.latitude ?? undefined,
          longitude: tempOrganisation.longitude ?? undefined,
          canbedonated: !!tempOrganisation.canbedonated,
          canmanagemosque: !!tempOrganisation.canmanagemosque,
          isgraveservices: !!tempOrganisation.isgraveservices,
          status: tempOrganisation.status ?? ActiveInactiveStatus.ACTIVE,
        });

        const savedOrganisation = await organisationRepo.save(newOrganisation);

        if (tempOrganisation.isgraveservices && (tempOrganisation.serviceoffered?.length ?? 0) > 0) {
          const serviceEntities = (tempOrganisation.serviceoffered ?? []).map((service) =>
            serviceRepo.create({
              service,
              price: Number(Number(tempOrganisation.serviceprice?.[service] ?? 0).toFixed(2)),
              organisation: { id: savedOrganisation.id },
              tahfizcenter: null,
            }),
          );

          await serviceRepo.save(serviceEntities);
        }

        const paymentConfigDraft = (tempOrganisation.paymentconfigdraft ?? []).filter(
          (config) => config?.paymentPlatformId && config?.paymentFieldId && config?.value
        );

        if (paymentConfigDraft.length > 0) {
          const configEntities = paymentConfigDraft.map((config) =>
            paymentConfigRepo.create({
              organisation: { id: savedOrganisation.id },
              paymentplatform: { id: config.paymentPlatformId },
              paymentfield: { id: config.paymentFieldId },
              value: config.value,
            })
          );
          await paymentConfigRepo.save(configEntities);
        }

        const defaultPassword = "password";
        const temporaryAdminUser = userRepo.create({
          fullname: tempOrganisation.contactname || `${tempOrganisation.name} Admin`,
          email: adminEmail,
          phoneno: tempOrganisation.contactphoneno?.trim() || undefined,
          password: hashPassword(defaultPassword),
          role: "admin",
          organisation: { id: savedOrganisation.id },
          states: tempOrganisation.states ?? [],
        });

        const savedTemporaryAdmin = await userRepo.save(temporaryAdminUser);

        const defaultPermissions = permissionRepo.create(
          buildDefaultPermissions({
            user: savedTemporaryAdmin,
            role: savedTemporaryAdmin.role,
            organisation: savedOrganisation,
          })
        );
        await permissionRepo.save(defaultPermissions);

        tempOrganisation.approvalstatus = ApprovalStatus.APPROVED;
        tempOrganisation.approvedorganisationid = savedOrganisation.id;
        tempOrganisation.approvedadminuserid = savedTemporaryAdmin.id;

        const reviewedTemp = await tempOrganisationRepo.save(tempOrganisation);

        return {
          temporganisation: reviewedTemp,
          organisation: savedOrganisation,
          temporaryAdmin: {
            id: savedTemporaryAdmin.id,
            email: savedTemporaryAdmin.email,
            defaultPassword,
          },
        };
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(TempOrganisation);
      const result = await repo.delete(input.id);

      if (!result.affected) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Temporary organisation not found",
        });
      }

      return { success: true };
    }),
});
