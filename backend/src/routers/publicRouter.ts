import { z } from "zod";
import { publicProcedure, router } from "../trpc.ts";

export const publicRouter = router({
  getClientIp: publicProcedure
    .query(({ ctx }) => {
      const req = ctx.req;

      const ip =
        req.headers["cf-connecting-ip"] || // Cloudflare
        req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";

      return { ip };
    }),
});
