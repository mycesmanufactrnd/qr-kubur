import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc.ts";
import bcrypt from "bcrypt"; 
import { z } from "zod";
import { AppDataSource } from "../datasource.ts";
import { Permission, User } from "../db/entities.ts";
import { updateUserSchema, userSchema } from "../schemas/userSchema.ts";

export const usersRouter = router({
  // 🔹 Standardized getPaginated
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).default(10),
        search: z.string().optional(),
        // 🔹 Standardized naming for context filtering
        organisationIds: z.array(z.number()).optional(),
        tahfizIds: z.array(z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, organisationIds, tahfizIds } = input;
      const userRepo = AppDataSource.getRepository(User);

      const query = userRepo.createQueryBuilder("user")
        .leftJoinAndSelect("user.organisation", "organisation")
        .leftJoinAndSelect("user.tahfizcenter", "tahfizcenter");

      // 🔹 1. Role-based Context Filtering (Supervisor Rule)
      // Restricts standard admins to users within their organizations/centers
      if (organisationIds && organisationIds.length > 0) {
        query.andWhere("user.organisationId IN (:...orgIds)", { orgIds: organisationIds });
      }

      if (tahfizIds && tahfizIds.length > 0) {
        query.andWhere("user.tahfizcenterId IN (:...tIds)", { tIds: tahfizIds });
      }

      // 🔹 2. Explicit Search Logic (andWhere + ILIKE)
      // Standardized to search both Full Name and Email for easier impersonation
      if (search?.trim()) {
        query.andWhere(
          "(user.fullname ILIKE :search OR user.email ILIKE :search)",
          { search: `%${search.trim()}%` }
        );
      }

      // 🔹 3. Execution
      const [items, total] = await query
        .orderBy("user.createdat", "DESC")
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      // 🔹 4. Sanitization (Safety: Never return passwords)
      const sanitizedItems = items.map(({ password, ...rest }) => rest);

      return { items: sanitizedItems, total };
    }),

  getUserById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: input.id } });
      if (!user) throw new Error(`User with id ${input.id} not found`);
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),

  create: protectedProcedure
    .input(userSchema)
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);
      const permissionRepo = AppDataSource.getRepository(Permission);
      const user = userRepo.create(input);
      const savedUser = await userRepo.save(user);

      if (savedUser) {
        const permissions = permissionRepo.create([
          { slug: 'permissions_edit', enabled: true, user: savedUser },
          { slug: 'permissions_view', enabled: true, user: savedUser },
        ]);
        await permissionRepo.save(permissions);
      }

      const { password, ...userWithoutPassword } = savedUser;
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
      return await userRepo.delete(input);
    }),
});