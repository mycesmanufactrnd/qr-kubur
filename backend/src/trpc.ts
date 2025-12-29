import { initTRPC, TRPCError } from "@trpc/server";
import { verifyToken } from "./auth.ts";

export const createContext = ({ req }: { req: any }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? verifyToken(token) : null;
  return { user };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;

// publicProcedure: normal procedure anyone can call (no auth check).
export const publicProcedure = t.procedure;

// protectedProcedure: wraps a procedure with a middleware (check logged in)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});
