import { router, protectedProcedure, publicProcedure } from "../trpc.ts";
import { z } from "zod";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

// Zod is like DTO (Class Validator)
// .validation() method on a procedure just tells tRPC how to validate the input
// tRPC itself does not include a validation library, still need a schema validator
// .input(zodSchema) is just shorthand for .validation(zodSchema)

export const usersRouter = router({
  getUserById: publicProcedure
    .input(
      z.object({
        // validation id must be a number
        id: z.number(),
      })
    )
    .query(({ input }) => {
      return db.select()
        .from(users)
        .where(
          eq(users.id, input.id)
        );
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
    .mutation(({ input }) => db.insert(users).values(input)),
});

