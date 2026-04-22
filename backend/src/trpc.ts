import { initTRPC, TRPCError } from "@trpc/server";
import { verifyToken } from "./auth.ts";

// Every tRPC request passes through createContext
// Extract the JWT from the Authorization header or httpOnly cookies
// Call verifyToken(token) to validate the JWT and get the payload (user info)

/**
 * Updated to support both Bearer tokens and httpOnly cookies
 * - For web: Uses Authorization header (backward compatible)
 * - For mobile: Uses secure httpOnly cookies
 * Priority: Bearer token > Cookie > None
 */
export const createContext = ({ req, res }: { req: any; res: any }) => {
  let token = req.headers.authorization?.replace("Bearer ", "");
  
  // If no Authorization header, try to get from cookies (httpOnly secure cookies)
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  
  const user = token ? verifyToken(token) : null;
  return { user, req, reply: res };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;

// publicProcedure: normal procedure anyone can call (no auth check).
export const publicProcedure = t.procedure;

// protectedProcedure now checks token validity and type
// Validates that user is authenticated and token is an access token
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  
  // Validate token type to prevent refresh tokens from being used as access tokens
  if (ctx.user.type === "refresh") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token type" });
  }
  
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
