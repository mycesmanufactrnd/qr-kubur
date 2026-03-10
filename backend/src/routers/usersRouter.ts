import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc.ts";
import bcrypt from "bcrypt"; 
import { z } from "zod";
import { AppDataSource } from "../datasource.ts";
import { Permission, User } from "../db/entities.ts";
import { updateUserSchema, userSchema } from "../schemas/userSchema.ts";

export const usersRouter = router({
  getUserById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);

      const user = await userRepo.findOne({
        where: { id: input.id },
        relations: ['organisation', 'tahfizcenter', 'organisation.organisationtype'],
      });

      if (!user) {
        throw new Error(`User with id ${input.id} not found`);
      }

      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword;
    }),
  
  getUsers: protectedProcedure
    .input(
      z.object({
        currentUser: z.object({
          id: z.number(),
          organisation: z.object({ id: z.number() }).nullable(),
          tahfizcenter: z.object({ id: z.number() }).nullable(),
        }),
        checkRole: z.object({
          superadmin: z.boolean(),
          admin: z.boolean(),
          employee: z.boolean(),
          tahfiz: z.boolean(),
        }),
      })
    )
    .query(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      
      const { currentUser, checkRole } = input;

      if (!currentUser) return [];

      let where: any = {};

      if (!checkRole.superadmin) {
        if (checkRole.admin) {
          where.role = ["admin", "employee"];

          if (currentUser.organisation) {
            where.organisationId = currentUser.organisation.id;
          }

          if (currentUser.tahfizcenter) {
            where.tahfizcenterId = currentUser.tahfizcenter.id;
          }

        } else if (checkRole.employee) {
          where.id = currentUser.id;
        } else {
          return [];
        }
      }

      const users = await userRepo.find({ where });

      const sanitizedUsers = users.map(({ password, ...rest }) => rest);

      return sanitizedUsers;

    }),

  getPaginated: protectedProcedure
    .input(
        z.object({
        page: z.number().min(1).optional(),
        pageSize: z.number().min(1).optional(),
        search: z.string().optional(),
        currentUser: z.object({
          id: z.number(),
          organisation: z.object({ id: z.number() }).nullable(),
          tahfizcenter: z.object({ id: z.number() }).nullable(),
        }),
        checkRole: z.object({
            superadmin: z.boolean(),
            admin: z.boolean(),
            employee: z.boolean(),
            tahfiz: z.boolean(),
        }).optional(),
        })
    )
    .query(async ({ input }) => {
        const { page, pageSize, search, currentUser, checkRole } = input;

        const userRepo = AppDataSource.getRepository(User);

        const query = userRepo.createQueryBuilder("user")
        .leftJoinAndSelect("user.organisation", "organisation")
        .leftJoinAndSelect("user.tahfizcenter", "tahfizcenter");

        
        if (!checkRole?.superadmin) {
          if (!currentUser?.organisation && !currentUser?.tahfizcenter) {
            query.andWhere("user.id = :id", { id: currentUser.id });
          }
          else if (checkRole?.admin) {
            query.andWhere("user.role IN (:...roles)", { roles: ["admin", "employee"] });

            if (currentUser.organisation) {
              query.andWhere("user.organisationId = :orgId", { orgId: currentUser.organisation.id });
            }

            if (currentUser.tahfizcenter) {
              query.andWhere("user.tahfizcenterId = :tahfizId", { tahfizId: currentUser.tahfizcenter.id });
            }

          } else if (checkRole?.employee) {
            query.andWhere("user.id = :id", { id: currentUser.id });
          } else {
            return { items: [], total: 0 };
          }
        }

        if (search) {
            query.andWhere("user.fullname ILIKE :search", { search: `%${search}%` });
        }

        if (page && pageSize) {
            query.skip((page - 1) * pageSize).take(pageSize);
        }

        const [items, total] = await query
            .orderBy("user.createdat", "DESC")
            .getManyAndCount();

        const sanitizedItems = items.map(({ password, ...rest }) => rest);

        return { items: sanitizedItems, total };
    }),

  create: protectedProcedure
    .input(userSchema)
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      const permissionRepo = AppDataSource.getRepository(Permission);

      const user = userRepo.create(input);

      const savedUser = await userRepo.save(user);

      const { password, ...userWithoutPassword } = savedUser;

      if (savedUser) {
        const { role, tahfizcenter, organisation } = userWithoutPassword;

        let defaultPermission = [
          { slug: 'permissions_edit', enabled: true, user: savedUser },
          { slug: 'permissions_view', enabled: true, user: savedUser },
        ];

        if (role === 'admin') {
          defaultPermission.push(
            { slug: 'users_view', enabled: true, user: savedUser },
            { slug: 'users_create', enabled: true, user: savedUser },
            { slug: 'users_edit', enabled: true, user: savedUser },
            { slug: 'users_delete', enabled: true, user: savedUser }
          );

          defaultPermission.push(
            { slug: 'posts_view', enabled: true, user: savedUser },
            { slug: 'posts_create', enabled: true, user: savedUser },
            { slug: 'posts_edit', enabled: true, user: savedUser },
            { slug: 'posts_delete', enabled: true, user: savedUser }
          );

          if (tahfizcenter?.id) {
            defaultPermission.push(
              { slug: 'donations_view', enabled: true, user: savedUser },
              { slug: 'donations_verify', enabled: true, user: savedUser },
              { slug: 'donations_reject', enabled: true, user: savedUser },
            );

            defaultPermission.push(
              { slug: 'tahfiz_view', enabled: true, user: savedUser },
              { slug: 'tahfiz_create', enabled: true, user: savedUser },
              { slug: 'tahfiz_edit', enabled: true, user: savedUser },
              { slug: 'tahfiz_delete', enabled: true, user: savedUser }
            );

            defaultPermission.push(
              { slug: 'tahlil_view', enabled: true, user: savedUser },
              { slug: 'tahlil_accept', enabled: true, user: savedUser },
              { slug: 'tahlil_reject', enabled: true, user: savedUser },
              { slug: 'tahlil_complete', enabled: true, user: savedUser }
            );
          } else if (organisation?.id) {
            defaultPermission.push(
              { slug: 'organisations_view', enabled: true, user: savedUser },
              { slug: 'organisations_create', enabled: true, user: savedUser },
              { slug: 'organisations_edit', enabled: true, user: savedUser },
              { slug: 'organisations_delete', enabled: true, user: savedUser }
            );

            if (organisation.canbedonated) {
              defaultPermission.push(
                { slug: 'donations_view', enabled: true, user: savedUser },
                { slug: 'donations_verify', enabled: true, user: savedUser },
                { slug: 'donations_reject', enabled: true, user: savedUser },
              );
            }

            if (organisation.canmanagemosque) {
              defaultPermission.push(
                { slug: 'mosques_view', enabled: true, user: savedUser },
                { slug: 'mosques_create', enabled: true, user: savedUser },
                { slug: 'mosques_edit', enabled: true, user: savedUser },
                { slug: 'mosques_delete', enabled: true, user: savedUser },
              );
            }
          }
        }

        const permissions = permissionRepo.create(defaultPermission);
        await permissionRepo.save(permissions);
      }

      return userWithoutPassword;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: updateUserSchema }))
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneByOrFail({ id: input.id });

      userRepo.merge(user, input.data);

      const savedUser = await userRepo.save(user);
      const { password, ...userWithoutPassword } = savedUser;

      return userWithoutPassword;
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      return userRepo.delete(input);
    }),
});

