import "reflect-metadata";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const backendNgrokUrl = process.env.BACKEND_NGROK_URL;
console.log("\n🌍 BACKEND NGROK URL:");
console.log(process.env.BACKEND_NGROK_URL || "❌ Not set");

const frontendNgrokUrl = process.env.FRONTEND_NGROK_URL;
console.log("\n🌍 FRONTEND NGROK URL:");
console.log(process.env.FRONTEND_NGROK_URL || "❌ Not set");

const viteTRPCUrl = process.env.VITE_TRPC_URL;
console.log("\n🌍 TRPC URL:");
console.log(process.env.VITE_TRPC_URL || "❌ Not set");

import { AppDataSource } from "./datasource.ts";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext } from "./trpc.ts";
import { appRouter } from "./routers/appRouter.ts";
import { supabaseClient } from "./supabase.ts";
import multipart from '@fastify/multipart';
import formbody from "@fastify/formbody";
import cookie from '@fastify/cookie'; //cookie support for secure httpOnly cookies
import { getToyyibpayConfig } from "./config/toyyibpay.config.ts";
import { registerAPIRoutes } from "./api/api.ts";
import { getBucketConfig } from "./config/bucket.config.ts";
import { getBillplzConfig } from "./config/billplz.config.ts";
import { verifyToken } from "./auth.ts";
import { asyncLocalStorage } from "./helpers/requestContext.ts";

const app = Fastify({
  trustProxy: true,
  // tRPC batching joins multiple procedure names into a single `:path` segment.
  // Fastify's router (find-my-way) has a relatively small default `maxParamLength`,
  // which can cause batched URLs to 404 ("Route ... not found") when the segment is long.
  maxParamLength: 5000,
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
  origin: (origin, callback) => {
    // allow mobile apps, curl, postman
    if (!origin) return callback(null, true);

    const allowed = [
      'localhost:5173',
      'localhost:3000',
      frontendNgrokUrl,
      backendNgrokUrl,
      'pinggy-free.link',
      'ngrok',
    ].filter(Boolean);

    const isAllowed = allowed.some((a) => origin.includes(a));

    if (isAllowed) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS:", origin);

    return callback(null, true);
  },
  credentials: true,
});

// Register cookie plugin to support secure httpOnly cookies
await app.register(cookie);

await app.register(multipart);
await app.register(formbody);

registerAPIRoutes(app);

// NOTE: @trpc/server's Fastify adapter may ignore its own `prefix` option in some builds.
// Wrap it in a Fastify plugin and use Fastify's `prefix` option so routes reliably mount under `/trpc`.
app.register(
  (instance, _opts, done) => {
    instance.register(fastifyTRPCPlugin, {
      trpcOptions: {
        router: appRouter,
        createContext,
        allowPostForQueries: true,
        allowGetForQueries: true,
      },
    });
    done();
  },
  { prefix: "/trpc" },
);

app.get("/", async () => {
  return { message: "tRPC backend is running" };
});

app.addHook("onRequest", (req, reply, done) => {
  // Try both Bearer token and cookies for token extraction
  let token = req.headers.authorization?.replace("Bearer ", "");
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  
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

console.log('\n📦 ToyyibPay Configs:');
console.table(
  Object.entries(toyyibpayConfig).map(([key, value]) => ({
    key,
    value: value || '❌ MISSING'
  }))
);

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
  console.log('\n✅ All bucket configs loaded');
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

    if (process.env.NODE_ENV !== "production") {
      console.log("\nFastify routes:");
      console.log(app.printRoutes());
    }

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
  console.log(`\n❌ Missing Billplz configs: ${missingBillplzKeys.join(', ')}`);
}

bootstrap();


export type AppRouter = typeof appRouter;
