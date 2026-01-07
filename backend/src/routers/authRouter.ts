import crypto from "crypto";
import { router, publicProcedure } from "../trpc.ts";
import { z } from "zod";
import bcrypt from "bcrypt";
import { User } from "../db/entities/User.entity.ts";
import { signToken } from "../auth.ts";
import { assertRole } from "../helpers/authHelper.ts";
import { AppDataSource } from "../datasource.ts";


export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const userRepo = AppDataSource.getRepository(User);

      let user = await userRepo.findOne({
        where: { email: input.email },
        relations: ['organisation', 'tahfizcenter']
      });

      if (!user) throw new Error("Invalid credentials");
      if (!user.password) throw new Error("No password given");
      if (!user.role) throw new Error("No role given");

      const hashedInput = crypto.createHash("sha256").update(input.password).digest("hex");
      if (hashedInput !== user.password) throw new Error("Invalid credentials");

      const role = user.role;
      assertRole(role);

      const token = signToken({
        id: user.id.toString(), 
        role 
      });

      const { password, organisation, tahfizcenter, ...userWithoutPassword } = user;

      return {
        token,
        organisation,
        tahfizcenter,
        ...userWithoutPassword,
      };
    }),
});
