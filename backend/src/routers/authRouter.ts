import crypto from "crypto";
import { router, publicProcedure } from "../trpc.ts";
import { z } from "zod";
import { User } from "../db/entities/User.entity.ts";
import { signToken } from "../auth.ts";
import { assertRole } from "../helpers/authHelper.ts";
import { AppDataSource } from "../datasource.ts";


export const authRouter = router({
  getClientIp: publicProcedure
    .query(({ ctx }) => {
      const req = ctx.req;

      const ip =
        req.headers["cf-connecting-ip"] || // Cloudflare
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

      return ip;
    }),

  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx  }) => {
      const userRepo = AppDataSource.getRepository(User);

      let clientIp = ctx.req.ip;

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
        clientIp,
        organisation,
        tahfizcenter,
        ...userWithoutPassword,
      };
    }),
});
