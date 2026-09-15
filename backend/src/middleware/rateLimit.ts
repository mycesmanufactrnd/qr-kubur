import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Fixed-window counters are cheap but leak memory for one-off IPs if never
// swept — this periodic sweep keeps the map bounded.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
).unref();

/**
 * Per-procedure rate limit, keyed by client IP + tRPC path.
 *
 * This is in addition to the global `@fastify/rate-limit` (60 req/min/IP
 * across *every* route) registered in server.ts — that flat limit is too
 * loose for public, unauthenticated write endpoints (login, kariah
 * registration, quotation/tahlil submission, ...) that bots can hit directly,
 * and too tight for legitimate read-heavy dashboard usage that shares the
 * same bucket.
 *
 * Note: this counter is in-memory per process. The backend runs under PM2 in
 * cluster mode (5 instances, see ecosystem.config.cjs), and there's no shared
 * store (e.g. Redis) here — same limitation the existing global rate limiter
 * already has. In practice the effective ceiling is roughly `max * 5`,
 * distributed across whichever worker handles each request.
 */
export const rateLimited = (max: number, windowMs: number, message?: string) =>
  publicProcedure.use(({ ctx, path, next }) => {
    const ip = ctx.req?.ip ?? "unknown";
    const key = `${path}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: message ?? "Too many requests, please try again later.",
      });
    }

    return next();
  });
