import { initTRPC, TRPCError } from "@trpc/server";
import { verifyToken } from "./auth.ts";

// Every tRPC request passes through createContext
// Extract the JWT from the Authorization header
// Call verifyToken(token) to validate the JWT and get the payload (user info)

export const createContext = ({ req }: { req: any }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? verifyToken(token) : null;
  return { user, req };
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

// not sure needed or not, strict role procedure?
const roleGuard = (roles: Array<"superadmin"|"admin"|"employee">) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const adminProcedure = roleGuard(["superadmin", "admin"]);
export const superAdminProcedure = roleGuard(["superadmin"]);
