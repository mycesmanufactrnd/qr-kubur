import type { FastifyInstance } from "fastify";
import { registerUploadRoutes } from "./upload.js";
import { registerPaymentRoutes } from "./payment.js";
import { registerProxyRoutes } from "./proxy.js";

export const registerAPIRoutes = (app: FastifyInstance) => {
    registerUploadRoutes(app);
    registerPaymentRoutes(app);
    registerProxyRoutes(app);
}
