import type { FastifyInstance } from "fastify";
import { registerUploadRoutes } from "./upload.ts";
import { registerPaymentRoutes } from "./payment.ts";

export const registerAPIRoutes = (app: FastifyInstance) => {
    registerUploadRoutes(app);
    registerPaymentRoutes(app);
}
