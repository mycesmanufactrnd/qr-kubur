import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc.ts";
import bcrypt from "bcrypt"; 
import { z } from "zod";
import { AppDataSource } from "../datasource.ts";
import { User } from "../db/entities.ts";

// [GET BY ID]
// trpc.users.getUserById.query({ id: 1 }); 

// [CREATE]
// trpc.users.createUser.mutate({
//   fullName: "John Doe",
//   email: "john@example.com",
//   password: "hashed_password",
//   role: "admin"
// });

// Zod is like DTO (Class Validator)
// .validation() method on a procedure just tells tRPC how to validate the input
// tRPC itself does not include a validation library, still need a schema validator
// .input(zodSchema) is just shorthand for .validation(zodSchema)

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
      });

      if (!user) {
        throw new Error(`User with id ${input.id} not found`);
      }

      return user;
    }),
  
  createUser: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        email: z.string(),
        password: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);

      const user = userRepo.create({
        ...input,
        password: await bcrypt.hash(input.password, 10),
      });
      return await userRepo.save(user);
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
            where.tahfiz_centerId = currentUser.tahfizcenter.id;
          }

        } else if (checkRole.employee) {
          where.id = currentUser.id;
        } else {
          return [];
        }
      }

      return await userRepo.find({ where });
    }),
});

