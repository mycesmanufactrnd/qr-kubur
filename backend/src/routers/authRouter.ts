import crypto from "crypto";
import { router, publicProcedure, protectedProcedure } from "../trpc.ts";
import { z } from "zod";
import { User } from "../db/entities/User.entity.ts";
import {
  signAccessToken,
  signRefreshToken,
  rotateTokens,
  verifyToken,
} from "../auth.ts";
import { assertRole } from "../helpers/authHelper.ts";
import { AppDataSource } from "../datasource.ts";
import { OAuth2Client } from "google-auth-library";
import { GoogleUser } from "../db/entities.ts";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper function to set secure httpOnly cookies
 * - accessToken: Short-lived (30min), sent in every request
 * - refreshToken: Long-lived (7d), only used to get new access token
 */
const setCookies = (reply: any, accessToken: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === "production";
  
  reply.setCookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 60, // 30 minutes
  });

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
};

export const authRouter = router({
  getClientIp: publicProcedure.query(({ ctx }) => {
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
    .mutation(async ({ input, ctx }) => {
      const userRepo = AppDataSource.getRepository(User);

      let clientIp = ctx.req.ip;

      let user = await userRepo.findOne({
        where: { email: input.email },
        relations: [
          "organisation",
          "tahfizcenter",
          "organisation.organisationtype",
        ],
      });

      if (!user) throw new Error("Invalid credentials");
      if (!user.password) throw new Error("No password given");
      if (!user.role) throw new Error("No role given");

      const hashedInput = crypto
        .createHash("sha256")
        .update(input.password)
        .digest("hex");
      if (hashedInput !== user.password) throw new Error("Invalid credentials");

      const role = user.role;
      assertRole(role);

      /**
       * Generate both access and refresh tokens for token rotation
       * Access token is short-lived (15m) for security
       * Refresh token is long-lived (7d) to refresh access without re-login
       */
      const accessToken = signAccessToken({
        id: user.id.toString(),
        role,
      });

      const refreshToken = signRefreshToken({
        id: user.id.toString(),
        role,
      });

      setCookies(ctx.reply, accessToken, refreshToken);

      const { password, organisation, tahfizcenter, ...userWithoutPassword } =
        user;

      return {
        // Return both tokens for backward compatibility + security
        // Clients can use either method: cookies or Bearer header
        accessToken,
        refreshToken,
        clientIp,
        organisation,
        tahfizcenter,
        ...userWithoutPassword,
      };
    }),

  /**
   * New endpoint for token refresh
   * - Takes refresh token
   * - Validates it
   * - Returns new access + refresh tokens (token rotation)
   * - Sets new cookies automatically
   */
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      let refreshToken = input.refreshToken || ctx.req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new Error("No refresh token provided");
      }

      const decoded = verifyToken(refreshToken);

      if (!decoded || decoded.type !== "refresh") {
        throw new Error("Invalid refresh token");
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: parseInt(decoded.id) },
        relations: [
          "organisation",
          "tahfizcenter",
          "organisation.organisationtype",
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      /**
       * Token rotation - generate new token pair
       * Old refresh token is invalidated, new one must be used next time
       */
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        rotateTokens({
          id: user.id.toString(),
          role: user.role,
        });

      setCookies(ctx.reply, newAccessToken, newRefreshToken);

      const { password, organisation, tahfizcenter, ...userWithoutPassword } =
        user;

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        organisation,
        tahfizcenter,
        ...userWithoutPassword,
      };
    }),

  /**
   * New logout endpoint to clear tokens
   * Clears both accessToken and refreshToken cookies
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.reply.clearCookie("accessToken");
    ctx.reply.clearCookie("refreshToken");
    return { success: true };
  }),

  /**
   * Google login for public users - NO TOKENS required
   * Returns only user info, no authentication tokens
   * Used for public access/viewing without admin privileges
   */
  loginGoogle: publicProcedure
    .input(
      z.object({
        credential: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const googleUserRepo = AppDataSource.getRepository(GoogleUser);

      const ticket = await googleClient.verifyIdToken({
        idToken: input.credential,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        throw new Error("Invalid Google token");
      }

      const { email, name, picture } = payload;

      let user = await googleUserRepo.findOne({
        where: { email },
      });

      if (!user) {
        user = googleUserRepo.create({ email, name, picture });
        await googleUserRepo.save(user);
      }

      /**
       * No tokens returned for public Google users
       * Public access only - no auth needed for viewing content
       */
      return {
        user,
        message: "Public login successful - no token required",
      };
    }),
});
