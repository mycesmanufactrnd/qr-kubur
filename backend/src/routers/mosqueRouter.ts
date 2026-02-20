import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { Mosque } from "../db/entities.ts"; 
import { mosqueSchema } from '../schemas/mosqueSchema.ts';

export const mosqueRouter = router({
  getMosqueById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      if (!input.id) return null;
      return await AppDataSource.getRepository(Mosque).findOne({ 
        where: { id: input.id },
        relations: ["organisation"] 
      });
    }),

  getMosquesByOrganisationId: protectedProcedure
    .input(z.object({ organisationId: z.number() }))
    .query(async ({ input }) => {
      if (!input.organisationId) return null;

      return await AppDataSource.getRepository(Mosque).find({ 
        where: { 
          organisation: {
            id: input.organisationId
          } 
        },
      });
    }),

  getMosqueByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      filters: z.record(z.string(), z.any()).optional()
    }))
    .query(async ({ input }) => {
      const mosqueRepo = AppDataSource.getRepository(Mosque);
      const query = mosqueRepo.createQueryBuilder("mosque")
        .leftJoinAndSelect("mosque.organisation", "organisation");
      
      if (input.filters) {
        for (const [key, value] of Object.entries(input.filters)) {
          if (!value) continue;

          if (value) {
            if (key === 'name') {
              query.andWhere("mosque.name ILIKE :name", { name: `%${value}%` });
            } else if (key === 'state' && value !== 'nearby') {
              query.andWhere("mosque.state = :state", { state: value });
            } else if (key === 'organisationId') {
              query.andWhere("organisation.id = :orgId", { orgId: value });
            } else if (key === 'ids' && Array.isArray(value) && value.length > 0) {
              const ids = value.map((v: any) => v.id);
              query.andWhere("mosque.id IN (:...ids)", { ids });
            }  else if (Object.keys(mosqueRepo.metadata.propertiesMap).includes(key)) {
              query.andWhere(`mosque.${key} = :${key}`, { [key]: value });
            }
          }
        }
      }

      if (input.filters?.limit) {
        query.limit(input.filters.limit);
      }

      if (input.coordinates) {
        const { latitude, longitude } = input.coordinates;
        
        query.andWhere("mosque.latitude IS NOT NULL AND mosque.longitude IS NOT NULL");

        query.addSelect(`
          earth_distance(
            ll_to_earth(mosque.latitude, mosque.longitude),
            ll_to_earth(:lat, :lng)
          )`, 'distance')
          .orderBy('distance', 'ASC')
          .setParameters({ lat: latitude, lng: longitude });

        const { entities, raw } = await query.getRawAndEntities();

        return entities.map((entity, index) => ({
          ...entity,
          distance: raw[index].distance ? Number(raw[index].distance) : null,
        }));
      }

      return await query.orderBy("mosque.name", "ASC").getMany();
    }),

  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterName: z.string().optional(),
      filterState: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterState } = input;
      
      const mosqueRepo = AppDataSource.getRepository(Mosque);
      const query = mosqueRepo.createQueryBuilder("mosque")
        .leftJoinAndSelect('mosque.organisation', 'organisation');

      if (filterName) {
        query.andWhere("mosque.name ILIKE :name", { search: `%${filterName}%` });
      }

      if (filterState) {
        query.andWhere("mosque.state = :state", { state: filterState });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy("mosque.id", "DESC")
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(mosqueSchema)
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Mosque);
      const mosque = repo.create(input);
      return await repo.save(mosque);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: mosqueSchema }))
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Mosque);
      const mosque = await repo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      repo.merge(mosque, cleanedInput);
      return repo.save(mosque);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const repo = AppDataSource.getRepository(Mosque);
      return repo.delete(input);
    }),
});