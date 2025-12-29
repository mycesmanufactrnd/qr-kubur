import { router, publicProcedure } from "../trpc.ts";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { signToken } from "../auth.ts";
import { assertRole } from "../helpers/authHelper.ts";
import { eq } from "drizzle-orm";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email));

      if (!user) throw new Error("Invalid credentials");
      if (!user.password) throw new Error("No password given");
      if (!user.role) throw new Error("No role given");
      
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      
      const role = user.role;
      assertRole(role);

      const token = signToken({ id: user.id.toString(), role: role });
      return { token, user: { id: user.id, fullName: user.fullName, role: user.role } };
    }),
});
