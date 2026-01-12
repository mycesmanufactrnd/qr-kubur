import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";
import { AppDataSource } from "../datasource.ts";
import { TahfizCenter } from "../db/entities.ts";

export const tahfizRouter = router({
    getTahfiz: publicProcedure
        .input(
            z.object({
            coordinates: z.object({
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180),
            }).optional().nullable()
            })
        )
        .query(async ({ input }) => {
            const repo = AppDataSource.getRepository(TahfizCenter);

            if (!input.coordinates) {
                return repo.find({ take: 100, order: { createdat: "DESC" } });
            }

            const { latitude, longitude } = input.coordinates;

            return repo.createQueryBuilder("tahfizcenter")
            .where("tahfizcenter.latitude IS NOT NULL AND tahfizcenter.longitude IS NOT NULL")
            .orderBy(
                `
                earth_distance(
                    ll_to_earth(tahfizcenter.latitude, tahfizcenter.longitude),
                    ll_to_earth(:lat, :lng)
                )
                `,
                "ASC"
            )
            .setParameters({ lat: latitude, lng: longitude })
            .getMany();
        }),

    getPaginated: protectedProcedure
        .input(
            z.object({
            page: z.number().min(1).optional(),
            pageSize: z.number().min(1).optional(),
            search: z.string().optional(),
            filterState: z.string().optional(),
            currentUserTahfiz: z.number().optional(),
            checkRole: z.object({
                superadmin: z.boolean(),
                admin: z.boolean(),
                employee: z.boolean(),
                tahfiz: z.boolean(),
            }).optional(),
            })
        )
        .query(async ({ input }) => {
            const { page, pageSize, search, filterState, currentUserTahfiz, checkRole } = input;

            const tahfizRepo = AppDataSource.getRepository(TahfizCenter);

            const query = tahfizRepo.createQueryBuilder("tahfizcenter");

            if ((checkRole?.admin || checkRole?.employee) && checkRole?.tahfiz && currentUserTahfiz) {
                query.andWhere("tahfizcenter.id = :id", { id: currentUserTahfiz });
            }

            if (search) {
                query.andWhere("tahfizcenter.name ILIKE :search", { search: `%${search}%` });
            }

            if (filterState) {
                query.andWhere("tahfizcenter.state = :state", { state: filterState });
            }

            if (page && pageSize) {
                query.skip((page - 1) * pageSize).take(pageSize);
            }

            const [items, total] = await query
                .orderBy("tahfizcenter.createdat", "DESC")
                .getManyAndCount();

            return { items, total };
        }),

});

