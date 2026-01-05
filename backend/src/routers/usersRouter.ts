import { router, protectedProcedure, publicProcedure, adminProcedure } from "../trpc.ts";
import bcrypt from "bcrypt"; 
import { z } from "zod";
import { AppDataSource } from "../datasource.ts";
import { User } from "../db/entities.ts";

const userRepo = AppDataSource.getRepository(User);

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
      const user = userRepo.create({
        ...input,
        password: await bcrypt.hash(input.password, 10),
      });
      return await userRepo.save(user);
    }),
});

