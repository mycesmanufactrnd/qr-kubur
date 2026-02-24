import z from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { WaqfProject } from "../db/entities/WaqfProject.entity.ts";
import { waqfProjectSchema } from "../schemas/waqfProjectSchema.ts";

export const waqfProjectRouter = router({
    getPaginated: publicProcedure
        .input(z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).default(10),
          filterWaqfName: z.string().optional().nullable()
        }))
        .query(async ({ input }) => {
            try {
                
                const { page, pageSize, filterWaqfName } = input;
                const tahfizRepo = AppDataSource.getRepository(WaqfProject);
                const query = tahfizRepo.createQueryBuilder("waqf");

                if (filterWaqfName) {
                    query.andWhere('waqf.waqfname ILIKE :waqfname', { waqfname: `%${filterWaqfName}%` });
                }

                if (page && pageSize) {
                    query.skip((page - 1) * pageSize).take(pageSize)
                }
            
                const [items, total] = await query
                    .orderBy("waqf.createdat", "DESC")
                    .getManyAndCount();
    
                const statsRaw = await tahfizRepo
                    .createQueryBuilder('waqf')
                    .select([
                        'COUNT(*) as total',
                        `SUM(CASE WHEN waqf.status = 'Ongoing' THEN 1 ELSE 0 END) as active`,
                        `SUM(CASE WHEN waqf.status = 'Completed' THEN 1 ELSE 0 END) as completed`,
                    ])
                    .getRawOne();
    
                const stats = {
                    total: Number(statsRaw.total),
                    active: Number(statsRaw.active),
                    completed: Number(statsRaw.completed),
                };
    
            
                return {
                    items: items ?? [],
                    total: total ?? 0,
                    stats,
                };
            } catch (error) {
                console.error('getPaginated error:', error);
                
                return {
                    items: [],
                    total: 0,
                    stats: { total: 0, active: 0, completed: 0 },
                };
            }
        }),

    create: protectedProcedure
        .input(waqfProjectSchema)
        .mutation(async ({ input }) => {
            const waqfRepo = AppDataSource.getRepository(WaqfProject);
    
            const waqf = waqfRepo.create(input);
            
            return await waqfRepo.save(waqf);
    }),
    
    update: protectedProcedure
        .input(z.object({ id: z.number(), data: waqfProjectSchema }))
        .mutation(async ({ input }) => {
            const waqfRepo = AppDataSource.getRepository(WaqfProject);
            const waqf = await waqfRepo.findOneByOrFail({ id: input.id });
    
            waqfRepo.merge(waqf, input.data);
    
            return await waqfRepo.save(waqf);
    }),
    
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ input }) => {
            const waqfRepo = AppDataSource.getRepository(WaqfProject);
            return await waqfRepo.delete(input);
    }),

    getWaqfById: publicProcedure
        .input(
            z.object({
              id: z.number()
            })
        )
        .query(async ({ input }) => {
          if (!input.id) {
            return null;
          }
    
          return await AppDataSource.getRepository(WaqfProject).findOne({ 
            where: { id: input.id },
          });
        }),

    getWaqfProject: publicProcedure
        .input(z.object({
            page: z.number(),
            pageSize: z.number(),
            filters: z.record(z.string(), z.any()).optional()
        }))
        .query(async ({ input }) => {
            const { page, pageSize, filters } = input;

            const waqfRepo = AppDataSource.getRepository(WaqfProject);
        
            const query = waqfRepo.createQueryBuilder("waqf")
        
            if (filters) {
              for (const [key, value] of Object.entries(filters)) {
                if (!value) continue;

                if (value) {
                    if (key === "category") {
                        query.andWhere(`waqf.${key}::text ILIKE :${key}`, { [key]: `%${value}%` });
                    } else {
                        query.andWhere(`waqf.${key} ILIKE :${key}`, { [key]: `%${value}%` });
                    }
                }
              }
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize)
            }

            const [items, total] = await query
                .orderBy("waqf.createdat", "DESC")
                .getManyAndCount();
        
            return {
                items: items ?? [],
                total: total ?? 0,
            };
        }),
});