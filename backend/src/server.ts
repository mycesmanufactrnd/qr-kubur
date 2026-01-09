import "reflect-metadata";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext, router as trpcRouter } from "./trpc.ts";
import { usersRouter } from "./routers/usersRouter.ts";
import { AppDataSource } from "./datasource.ts";
import { authRouter } from "./routers/authRouter.ts";
import { appRouter } from "./routers/appRouter.ts";
import { supabaseClient } from "./supabase.ts";

const app = Fastify({
  trustProxy: true,
});

{/*

BackEnd Architecture

| Component   | Role                                     |
| ----------- | ---------------------------------------- |
| Fastify     | Web server (receives HTTP requests)      |
| tRPC Router | Controller layer (routes calls to logic) |
| Type ORM    | Service/repository layer (queries DB)    |
| Zod         | DTO/validation layer (checks input)      |
| JWT/Auth    | Auth layer (check who can call what)     |

*/}

await app.register(rateLimit, {
  global: true,
  max: 15, // max request
  timeWindow: "1 minute", //Each IP is allowed max X requests per 1 minute sliding window
  allowList: [
    "127.0.0.1",
  ]
});

await app.register(import('@fastify/cors'), {
  // origin: "*",
  origin: "http://localhost:5173",
});

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

async function bootstrap() {
  try {
    // Supabase Connection
    const { error } = await supabaseClient.auth.getSession();
    if (error) {
      throw error;
    }
    console.log("✅ Supabase connected");

    // Database (TypeORM)
    await AppDataSource.initialize();
    console.log("✅ Database connected and synchronized!");

    // Start Fastify
    // await app.listen({ port: 8000 });
    // console.log("🚀 tRPC backend running on http://localhost:8000");
    const PORT = Number(process.env.BACKEND_PORT ?? 8000)

    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`🚀 tRPC backend running on http://localhost:${PORT}`)

  } catch (err) {
    console.error("❌ Server failed to start");

    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }

    process.exit(1);
  }
}

bootstrap();


export type AppRouter = typeof appRouter;
