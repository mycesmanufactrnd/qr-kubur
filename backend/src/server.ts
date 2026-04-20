import "reflect-metadata";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { AppDataSource } from "./datasource.ts";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext } from "./trpc.ts";
import { appRouter } from "./routers/appRouter.ts";
import { supabaseClient } from "./supabase.ts";
import multipart from '@fastify/multipart';
import formbody from "@fastify/formbody";
import { getToyyibpayConfig } from "./config/toyyibpay.config.ts";
import { registerAPIRoutes } from "./api/api.ts";
import { getBucketConfig } from "./config/bucket.config.ts";
import { getBillplzConfig } from "./config/billplz.config.ts";
import { verifyToken } from "./auth.ts";
import { asyncLocalStorage } from "./helpers/requestContext.ts";

const app = Fastify({
  trustProxy: true,
});

await app.register(rateLimit, {
  global: true,
  max: 60, // max request
  timeWindow: "1 minute", //Each IP is allowed max X requests per 1 minute sliding window
  allowList: [
    "127.0.0.1",
  ]
});

await app.register(import('@fastify/cors'), {
  origin: "*",
  // origin: "http://localhost:5173",
});

await app.register(multipart);
await app.register(formbody);

registerAPIRoutes(app);

app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { 
    router: appRouter, 
    createContext, 
    allowPostForQueries: true,
    allowGetForQueries: true,
  }
});

app.get("/", async () => {
  return { message: "tRPC backend is running" };
});

app.addHook("onRequest", (req, reply, done) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? verifyToken(token) : null;

  asyncLocalStorage.run(
    { userId: user?.id ? Number(user.id) : null },
    () => {
      req.user = user;
      done();
    }
  );
});

const toyyibpayConfig = getToyyibpayConfig();

const missingToyyibPayKeys = Object.entries(toyyibpayConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingToyyibPayKeys.length === 0) {
  console.log('✅ All toyyibPay configs loaded');
} else {
  console.log(`❌ Missing toyyibPay configs: ${missingToyyibPayKeys.join(', ')}`);
}

const bucketConfig = getBucketConfig();

const missingBucketsKeys = Object.entries(bucketConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingBucketsKeys.length === 0) {
  console.log('✅ All bucket configs loaded');
} else {
  console.log(`❌ Missing bucket configs: ${missingBucketsKeys.join(', ')}`);
}

async function bootstrap() {
  try {
    // Supabase Connection
    const { error } = await supabaseClient.auth.getSession();
    if (error) {
      throw error;
    }
    console.log("\n✅ Supabase connected");

    // Database (TypeORM)
    await AppDataSource.initialize();
    console.log("\n✅ Database connected and synchronized!");

    // Start Fastify
    const PORT = Number(process.env.BACKEND_PORT ?? 8000)

    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`\n🚀 tRPC backend running`)

  } catch (err) {
    console.error("\n ❌ Server failed to start");

    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }

    process.exit(1);
  }
}

const billplzConfig = getBillplzConfig();

const missingBillplzKeys = Object.entries(billplzConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingBillplzKeys.length === 0) {
  console.log('✅ All Billplz configs loaded');
} else {
  // This will catch your 'undefined' callback URL immediately
  console.log(`❌ Missing Billplz configs: ${missingBillplzKeys.join(', ')}`);
}

bootstrap();


export type AppRouter = typeof appRouter;
