import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Organisation, ServiceOffered } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import z from 'zod';
import { organisationSchema } from '../schemas/organisationSchema.ts';
import { ActiveInactiveStatus } from '../db/enums.ts';
import { Brackets, In, Repository } from 'typeorm';

type OrganisationServicePayload = NonNullable<z.infer<typeof organisationSchema>["services"]>[number];

const toRoundedPrice = (value: number) => Number(Number(value ?? 0).toFixed(2));

const serializeOrganisationWithServices = (organisation: Organisation, services: ServiceOffered[] = []) => {
  const serviceoffered = services.map((service) => service.service);
  const serviceprice = services.reduce<Record<string, number>>((acc, service) => {
    acc[service.service] = Number(service.price);
    return acc;
  }, {});

  return {
    ...organisation,
    services,
    serviceoffered,
    serviceprice,
  };
};

const buildOrganisationServiceEntities = (
  serviceRepo: Repository<ServiceOffered>,
  organisationId: number,
  servicesInput: OrganisationServicePayload[],
) => {
  return servicesInput.map((serviceInput) =>
    serviceRepo.create({
      service: serviceInput.service,
      price: toRoundedPrice(serviceInput.price),
      organisation: { id: organisationId } as Organisation,
      tahfizcenter: null,
    }),
  );
};

const loadOrganisationServicesMap = async (organisationIds: number[]) => {
  const serviceMap = new Map<number, ServiceOffered[]>();
  if (!organisationIds.length) return serviceMap;

  const services = await AppDataSource.getRepository(ServiceOffered).find({
    where: { organisation: { id: In(organisationIds) } },
    relations: ["organisation"],
    order: { id: "ASC" },
  });

  for (const service of services) {
    const organisationId = service.organisation?.id;
    if (!organisationId) continue;

    const existing = serviceMap.get(organisationId) ?? [];
    existing.push(service);
    serviceMap.set(organisationId, existing);
  }

  return serviceMap;
};

export const organisationRouter = router({
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        filterName: z.string().optional(),
        filterType: z.number().optional(),
        filterState: z.string().optional(),
        organisationId: z.number().optional().nullable(),
        isSuperAdmin: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterType, filterState, organisationId, isSuperAdmin } = input;

      const organisationRepo = AppDataSource.getRepository(Organisation);

      const query = organisationRepo.createQueryBuilder('organisation')
        .leftJoinAndSelect('organisation.parentorganisation', 'parent')
        .leftJoinAndSelect('organisation.organisationtype', 'type');

      if (!isSuperAdmin) {
        if (organisationId) {
          query.andWhere(
            new Brackets((qb) => {
              qb.where('organisation.id = :id', { id: organisationId })
                .orWhere('organisation.parentorganisationId = :id', { id: organisationId });
            })
          );
        }
      }

      if (filterName?.trim()) {
        query.andWhere('organisation.name ILIKE :name', {
          name: `%${filterName.trim()}%`,
        });
      }

      if (filterType) {
        query.andWhere('organisation.organisationtypeId = :typeId', { typeId: filterType });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere(':state = ANY(organisation.states)', { state: filterState });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('organisation.createdat', 'DESC')
        .getManyAndCount();

      const serviceMap = await loadOrganisationServicesMap(items.map((item) => item.id));
      const mappedItems = items.map((item) => serializeOrganisationWithServices(item, serviceMap.get(item.id) ?? []));

      return { items: mappedItems, total };
    }),

  create: protectedProcedure
    .input(organisationSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      const { services = [], ...organisationInput } = input;

      return await AppDataSource.transaction(async (manager) => {
        const organisationRepo = manager.getRepository(Organisation);
        const serviceRepo = manager.getRepository(ServiceOffered);

        const cleanedOrganisationInput = Object.fromEntries(
          Object.entries(organisationInput).filter(([, value]) => value !== undefined)
        ) as Partial<Organisation>;
        
        cleanedOrganisationInput.createdbyId = Number(ctx.user.id);

        const organisation = organisationRepo.create(cleanedOrganisationInput);
        const savedOrganisation = await organisationRepo.save(organisation);

        if (services.length > 0) {
          const serviceEntities = buildOrganisationServiceEntities(serviceRepo, savedOrganisation.id, services);
          await serviceRepo.save(serviceEntities);
        }

        const savedServices = await serviceRepo.find({
          where: { organisation: { id: savedOrganisation.id } },
          order: { id: 'ASC' },
        });

        return serializeOrganisationWithServices(savedOrganisation, savedServices);
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: organisationSchema }))
    .mutation(async ({ input }) => {
      return await AppDataSource.transaction(async (manager) => {
        const organisationRepo = manager.getRepository(Organisation);
        const serviceRepo = manager.getRepository(ServiceOffered);

        const organisation = await organisationRepo.findOneByOrFail({ id: input.id });
        const { services, ...partialOrganisationInput } = input.data;

        const cleanedInput = Object.fromEntries(
          Object.entries(partialOrganisationInput).filter(([, value]) => value !== undefined)
        ) as Partial<Organisation>;

        organisationRepo.merge(organisation, cleanedInput);
        const savedOrganisation = await organisationRepo.save(organisation);

        if (services !== undefined) {
          await serviceRepo.delete({ organisation: { id: savedOrganisation.id } });

          if (services.length > 0) {
            const serviceEntities = buildOrganisationServiceEntities(serviceRepo, savedOrganisation.id, services);
            await serviceRepo.save(serviceEntities);
          }
        }

        const savedServices = await serviceRepo.find({
          where: { organisation: { id: savedOrganisation.id } },
          order: { id: 'ASC' },
        });

        return serializeOrganisationWithServices(savedOrganisation, savedServices);
      });
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      return organisationRepo.delete(input);
    }),

  getAll: protectedProcedure
    .query(async () => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      const organisations = await organisationRepo.find({
        where: { status: ActiveInactiveStatus.ACTIVE },
        order: { name: 'ASC' }
      });

      const serviceMap = await loadOrganisationServicesMap(organisations.map((org) => org.id));
      return organisations.map((org) => serializeOrganisationWithServices(org, serviceMap.get(org.id) ?? []));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;

      const organisationRepo = AppDataSource.getRepository(Organisation);
      const organisation = await organisationRepo.findOne({
        where: { id: input.id, status: ActiveInactiveStatus.ACTIVE },
        relations: ["organisationtype", "parentorganisation"],
      });

      if (!organisation) return null;

      const serviceMap = await loadOrganisationServicesMap([organisation.id]);
      return serializeOrganisationWithServices(organisation, serviceMap.get(organisation.id) ?? []);
    }),

  getGraveServiceByState: publicProcedure
    .input(
      z.object({
        state: z.string().min(1),
        limit: z.number().min(1).max(50).default(20).optional(),
      })
    )
    .query(async ({ input }) => {
      const organisationRepo = AppDataSource.getRepository(Organisation);
      const organisations = await organisationRepo
        .createQueryBuilder("organisation")
        .where("organisation.status = :active", { active: ActiveInactiveStatus.ACTIVE })
        .andWhere("organisation.isgraveservices = :isgraveservices", { isgraveservices: true })
        .andWhere(":state = ANY(organisation.states)", { state: input.state })
        .orderBy("organisation.name", "ASC")
        .take(input.limit ?? 20)
        .getMany();

      const serviceMap = await loadOrganisationServicesMap(organisations.map((org) => org.id));
      return organisations
        .map((org) => serializeOrganisationWithServices(org, serviceMap.get(org.id) ?? []))
        .filter((org) => Array.isArray(org.serviceoffered) && org.serviceoffered.length > 0);
    }),

  getOrganisationByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      userState: z.string().optional().nullable(),
      filterName: z.string().optional().nullable(),
      filterCanBeDonated: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const repo = AppDataSource.getRepository(Organisation);
      if (!input.coordinates) return [];

      const { latitude, longitude } = input.coordinates;
      const query = repo.createQueryBuilder("organisation")
        .where("organisation.latitude IS NOT NULL AND organisation.longitude IS NOT NULL");

      if (input.userState) {
        query.andWhere(":state = ANY(organisation.states)", { state: input.userState });
      }

      if (input.filterName) {
        query.andWhere("organisation.name ILIKE :name", { name: `%${input.filterName}%` });
      }

      if (input.filterCanBeDonated) {
        query.andWhere("organisation.canbedonated = :canBeDonated", { canBeDonated: true });
      }

      query.orderBy(`earth_distance(ll_to_earth(organisation.latitude, organisation.longitude), ll_to_earth(:lat, :lng))`, 'ASC')
        .setParameters({ lat: latitude, lng: longitude });

      const organisations = await query.getMany();
      const serviceMap = await loadOrganisationServicesMap(organisations.map((org) => org.id));

      return organisations.map((org) => serializeOrganisationWithServices(org, serviceMap.get(org.id) ?? []));
    }),

  getParentAndChildOrgs: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      isIdOnly: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const { organisationId, isIdOnly = true } = input;

      const orgs = await AppDataSource.getRepository(Organisation)
        .createQueryBuilder('org')
        .where('org.id = :id OR org."parentorganisationId" = :id', { id: organisationId })
        .getMany();

      return isIdOnly ? orgs.map(o => o.id) : orgs;
    }),

  getByOrganisationTypeId: protectedProcedure
    .input(
      z.object({
        organisationTypeId: z.number().optional().nullable(),
        organisationIds: z.array(z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      const { organisationTypeId, organisationIds } = input;
      const organisationRepo = AppDataSource.getRepository(Organisation);

      const query = organisationRepo.createQueryBuilder('organisation')
        .where('organisation.status = :active', { active: ActiveInactiveStatus.ACTIVE });

      if (organisationIds && organisationIds.length > 0) {
        query.andWhere('organisation.id IN (:...ids)', { ids: organisationIds });
      }

      if (organisationTypeId) {
        query.andWhere('organisation.organisationtypeId = :id', {
          id: organisationTypeId,
        });
      }

      const organisations = await query.orderBy('organisation.name', 'ASC').getMany();
      const serviceMap = await loadOrganisationServicesMap(organisations.map((org) => org.id));

      return organisations.map((org) => serializeOrganisationWithServices(org, serviceMap.get(org.id) ?? []));
    }),
});
