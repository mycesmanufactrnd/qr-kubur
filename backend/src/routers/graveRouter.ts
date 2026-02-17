import { protectedProcedure, publicProcedure, router } from '../trpc.ts';
import { Grave } from '../db/entities.ts';
import { AppDataSource } from '../datasource.ts';
import { z } from 'zod';
import { graveSchema } from '../schemas/graveSchema.ts';

export const graveRouter = router({
  getPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).default(10),
      filterName: z.string().optional(),
      filterState: z.string().optional(),
      filterStatus: z.string().optional(),
      filterBlock: z.string().optional(),
      filterLot: z.string().optional(),
      organisationIds: z.array(z.number()).optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, filterName, filterState, filterStatus, filterBlock, filterLot, organisationIds } = input;
      const graveRepo = AppDataSource.getRepository(Grave);

      const query = graveRepo.createQueryBuilder('grave').leftJoinAndSelect('grave.organisation', 'organisation');

      if (organisationIds?.length) {
        query.andWhere('organisation.id IN (:...ids)', { ids: organisationIds });
      }
      
      if (filterName) {
        query.andWhere('grave.name ILIKE :name', { name: `%${filterName}%` });
      }

      if (filterState && filterState !== 'all') {
        query.andWhere('grave.state = :state', { state: filterState });
      }

      if (filterBlock) {
        query.andWhere('grave.block ILIKE :block', { block: `%${filterBlock}%` });
      }

      if (filterLot) {
        query.andWhere('grave.lot ILIKE :lot', { lot: `%${filterLot}%` });
      }

      if (filterStatus && filterStatus !== 'all') {
        query.andWhere('grave.status = :status', { status: filterStatus });
      }

      if (page && pageSize) {
        query.skip((page - 1) * pageSize).take(pageSize)
      }

      const [items, total] = await query
        .orderBy('grave.id', 'DESC')
        .getManyAndCount();

      return { items, total };
    }),

  create: protectedProcedure
    .input(graveSchema)
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);

      const grave = graveRepo.create(input);
      
      return await graveRepo.save(grave);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: graveSchema }))
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      const grave = await graveRepo.findOneByOrFail({ id: input.id });

      const cleanedInput = Object.fromEntries(
        Object.entries(input.data).filter(([_, v]) => v !== undefined)
      );

      graveRepo.merge(grave, cleanedInput);

      return await graveRepo.save(grave);
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      return await graveRepo.delete(input);
    }),

  bulkCreate: protectedProcedure
    .input(z.array(graveSchema))
    .mutation(async ({ input }) => {
      const graveRepo = AppDataSource.getRepository(Grave);
      const results = await graveRepo.save(input);
      return { count: results.length };
    }),

  getGraveById: publicProcedure
    .input(
        z.object({
          id: z.number()
        })
    )
    .query(async ({ input }) => {
      if (!input.id) {
        return null;
      }

      return await AppDataSource.getRepository(Grave).findOne({ 
        where: { id: input.id },
        relations: ["organisation"]
      });
    }),

  getGraveByCoordinates: publicProcedure
    .input(z.object({
      coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).optional().nullable(),
      filters: z.record(z.string(), z.string()).optional()
    }))
    .query(async ({ input }) => {
    const graveRepo = AppDataSource.getRepository(Grave);

    if (!input.coordinates) return [];

    const { latitude, longitude } = input.coordinates;

    const query = graveRepo.createQueryBuilder("grave")
      .where("grave.latitude IS NOT NULL AND grave.longitude IS NOT NULL");

    if (input.filters) {
      for (const [key, value] of Object.entries(input.filters)) {
        if (value) {
          query.andWhere(`grave.${key} ILIKE :${key}`, { [key]: `%${value}%` });
        }
      }
    }

    // if no extension created in psql
    // docker exec -it <container_name_or_id> psql -U <db_user> -d <db_name>
    // CREATE EXTENSION IF NOT EXISTS cube;
    // CREATE EXTENSION IF NOT EXISTS earthdistance;


    query.addSelect(`
      earth_distance(
        ll_to_earth(grave.latitude, grave.longitude),
        ll_to_earth(:lat, :lng)
      )`, 'distance')
      .orderBy(`
        earth_distance(
          ll_to_earth(grave.latitude, grave.longitude),
          ll_to_earth(:lat, :lng)
        )`, 'ASC')
      .setParameters({ lat: latitude, lng: longitude });

    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      distance: Number(raw[index].distance),
    }));
  }),
});