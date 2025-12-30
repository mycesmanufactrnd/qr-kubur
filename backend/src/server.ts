import "reflect-metadata";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext, router as trpcRouter } from "./trpc.ts";
import { usersRouter } from "./routers/usersRouter.ts";
import { AppDataSource } from "./datasource.ts";

// const app = Fastify({ logger: true });
const app = Fastify();

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
  max: 120, // max request
  timeWindow: "1 minute", //Each IP is allowed max X requests per 1 minute sliding window
  ban: 2, // if IP exceed limit 2 times in a row, temporary banned
  allowList: [
    "127.0.0.1",
    "http://localhost:5173/"
  ]
});

const appRouter = trpcRouter({
  users: usersRouter
});

// In tRPC, the HTTP method is always POST by default
// if get error (Unsupported POST-request to query procedure)
// but to check with Postman interchangeable POST with GET

app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext, allowPostForQueries: true }
});

app.get("/", async () => {
  return { message: "tRPC backend is running" };
});

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("Database connected and synchronized!");

  await app.listen({ port: 4000 });
  console.log("tRPC backend running on http://localhost:4000");
}

bootstrap();

export type AppRouter = typeof appRouter;
