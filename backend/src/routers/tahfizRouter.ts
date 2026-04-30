import z from "zod";
import { In, Repository } from "typeorm";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahfizCenter, ServiceOffered } from "../db/entities.ts";
import { tahfizSchema } from "../schemas/tahfizSchema.ts";

type TahfizServicePayload = NonNullable<
  z.infer<typeof tahfizSchema>["services"]
>[number];

const toRoundedPrice = (value: number) => Number(Number(value ?? 0).toFixed(2));

const serializeTahfizWithServices = (
  tahfiz: TahfizCenter,
  services: ServiceOffered[] = [],
  isActiveOnly = false,
) => {
  const visible = isActiveOnly ? services.filter((s) => s.isactive) : services;
  const serviceoffered = visible.map((service) => service.service);
  const serviceprice = visible.reduce<Record<string, number>>(
    (acc, service) => {
      acc[service.service] = Number(service.price);
      return acc;
    },
    {},
  );

  return {
    ...tahfiz,
    services: visible,
    serviceoffered,
    serviceprice,
  };
};

const buildServiceEntities = (
  serviceRepo: Repository<ServiceOffered>,
  tahfizId: number,
  servicesInput: TahfizServicePayload[],
) => {
  return servicesInput.map((serviceInput) =>
    serviceRepo.create({
      service: serviceInput.service,
      price: toRoundedPrice(serviceInput.price),
      isactive: serviceInput.isactive !== false,
      tahfizcenter: { id: tahfizId } as TahfizCenter,
    }),
  );
};

const loadServicesMap = async (tahfizIds: number[]) => {
  const serviceMap = new Map<number, ServiceOffered[]>();
  if (!tahfizIds.length) return serviceMap;

  const services = await AppDataSource.getRepository(ServiceOffered).find({
    where: { tahfizcenter: { id: In(tahfizIds) } },
    relations: ["tahfizcenter"],
    order: { id: "ASC" },
  });

  for (const service of services) {
    const tahfizId = service.tahfizcenter?.id;
    if (!tahfizId) continue;

    const existing = serviceMap.get(tahfizId) ?? [];
    existing.push(service);
    serviceMap.set(tahfizId, existing);
  }

  return serviceMap;
};

export const tahfizRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterState: z.string().optional(),
        currentUserTahfizCenterId: z.number().optional(),
        isSuperAdmin: z.boolean().default(false),
        isFromParentOrg: z
          .object({
            status: z.boolean().default(false),
            parentOrganisationId: z.number().min(1),
          })
          .nullable()
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        filterName,
        filterState,
        currentUserTahfizCenterId,
        isSuperAdmin,
        isFromParentOrg,
      } = input;

      const tahfizRepo = AppDataSource.getRepository(TahfizCenter);
      const query = tahfizRepo
        .createQueryBuilder("tahfiz")
        .leftJoinAndSelect("tahfiz.parentorganisation", "parentorganisation");

      if (!isSuperAdmin) {
        if (isFromParentOrg?.status) {
          query.andWhere("parentorganisation.id = :parentId", {
            parentId: isFromParentOrg.parentOrganisationId,
          });
        }
        else if (currentUserTahfizCenterId) {
          query.andWhere("tahfiz.id = :id", {
            id: currentUserTahfizCenterId,
          });
        }
        else {
          return { items: [], total: 0 };
        }
      }

      if (filterName?.trim()) {
        query.andWhere("tahfiz.name ILIKE :name", {
          name: `%${filterName.trim()}%`,
        });
      }

      if (filterState && filterState !== "all") {
        query.andWhere("tahfiz.state = :state", { state: filterState });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize);
      }

      const [items, total] = await query
        .orderBy("tahfiz.id", "DESC")
        .getManyAndCount();

      const serviceMap = await loadServicesMap(items.map((item) => item.id));
      const mappedItems = items.map((item) =>
        serializeTahfizWithServices(item, serviceMap.get(item.id) ?? []),
      );

      return { items: mappedItems, total };
    }),

  getTahfizById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;

      const tahfiz = await AppDataSource.getRepository(TahfizCenter).findOne({
        where: { id: input.id },
        relations: ["parentorganisation"],
      });

      if (!tahfiz) return null;

      const serviceMap = await loadServicesMap([tahfiz.id]);
      return serializeTahfizWithServices(
        tahfiz,
        serviceMap.get(tahfiz.id) ?? [],
        true,
      );
    }),

  getTahfizByCoordinates: publicProcedure
    .input(
      z.object({
        coordinates: z
          .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          })
          .optional()
          .nullable(),
        isTahlilServiceOnly: z.boolean().default(false),
        filterState: z.string().optional().nullable(),
        filterName: z.string().optional().nullable(),
        filterAddress: z.string().optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const tahfizRepo = AppDataSource.getRepository(TahfizCenter);
      if (!input.coordinates) return [];

      const { latitude, longitude } = input.coordinates;
      const query = tahfizRepo
        .createQueryBuilder("tahfiz")
        .where("tahfiz.latitude IS NOT NULL AND tahfiz.longitude IS NOT NULL");

      if (input.filterState) {
        query.andWhere("tahfiz.state = :state", { state: input.filterState });
      }

      if (input.isTahlilServiceOnly) {
        query
          .innerJoin("tahfiz.services", "services")
          .andWhere("LOWER(services.service) LIKE :tahlil", {
            tahlil: "%tahlil%",
          });
      }

      if (input.filterName) {
        query.andWhere("tahfiz.name ILIKE :name", {
          name: `%${input.filterName}%`,
        });
      }

      if (input.filterAddress) {
        query.andWhere("tahfiz.address ILIKE :address", {
          address: `%${input.filterAddress}%`,
        });
      }

      query
        .addSelect(
          `
          earth_distance(
            ll_to_earth(tahfiz.latitude, tahfiz.longitude),
            ll_to_earth(:lat, :lng)
          )`,
          "distance",
        )
        .orderBy("distance", "ASC")
        .setParameters({ lat: latitude, lng: longitude });

      const { entities, raw } = await query.getRawAndEntities();

      const serviceMap = await loadServicesMap(
        entities.map((entity) => entity.id),
      );

      return entities.map((entity, index) => ({
        ...serializeTahfizWithServices(
          entity,
          serviceMap.get(entity.id) ?? [],
          true,
        ),
        distance: Number(raw[index].distance),
      }));
    }),

  create: protectedProcedure
    .input(tahfizSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      const { services = [], ...tahfizInput } = input;

      return await AppDataSource.transaction(async (manager) => {
        const tahfizRepo = manager.getRepository(TahfizCenter);
        const serviceRepo = manager.getRepository(ServiceOffered);

        const cleanedTahfizInput = Object.fromEntries(
          Object.entries(tahfizInput).filter(
            ([, value]) => value !== undefined && value !== null,
          ),
        ) as Partial<TahfizCenter>;
        cleanedTahfizInput.createdbyId = Number(ctx.user.id);

        const tahfiz = tahfizRepo.create(cleanedTahfizInput);
        const savedTahfiz = await tahfizRepo.save(tahfiz);

        if (services.length > 0) {
          const serviceEntities = buildServiceEntities(
            serviceRepo,
            savedTahfiz.id,
            services,
          );
          await serviceRepo.save(serviceEntities);
        }

        const savedServices = await serviceRepo.find({
          where: { tahfizcenter: { id: savedTahfiz.id } },
          order: { id: "ASC" },
        });

        return serializeTahfizWithServices(savedTahfiz, savedServices);
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: tahfizSchema }))
    .mutation(async ({ input }) => {
      return await AppDataSource.transaction(async (manager) => {
        const tahfizRepo = manager.getRepository(TahfizCenter);
        const serviceRepo = manager.getRepository(ServiceOffered);

        const tahfiz = await tahfizRepo.findOneByOrFail({ id: input.id });
        const { services, ...partialTahfizInput } = input.data;

        const cleanedInput = Object.fromEntries(
          Object.entries(partialTahfizInput).filter(
            ([, value]) => value !== undefined,
          ),
        ) as Partial<TahfizCenter>;

        tahfizRepo.merge(tahfiz, cleanedInput);
        const savedTahfiz = await tahfizRepo.save(tahfiz);

        if (services !== undefined) {
          await serviceRepo.delete({ tahfizcenter: { id: savedTahfiz.id } });

          if (services.length > 0) {
            const serviceEntities = buildServiceEntities(
              serviceRepo,
              savedTahfiz.id,
              services,
            );
            await serviceRepo.save(serviceEntities);
          }
        }

        const savedServices = await serviceRepo.find({
          where: { tahfizcenter: { id: savedTahfiz.id } },
          order: { id: "ASC" },
        });

        return serializeTahfizWithServices(savedTahfiz, savedServices);
      });
    }),

  delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const repo = AppDataSource.getRepository(TahfizCenter);
    return repo.delete(input);
  }),
});
