import "fastify";
import type { TokenPayload } from "../auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: TokenPayload | null;
  }
}

