import "fastify";
import type { TokenPayload } from "../auth.ts";

declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload | null;
  }
}

