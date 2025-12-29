import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext, router as trpcRouter } from "./trpc.ts";
import { usersRouter } from "./routers/usersRouter.ts";

// const app = Fastify({ logger: true });
const app = Fastify();

{/*
BackEnd Architecture

| Component   | Role                                     |
| ----------- | ---------------------------------------- |
| Fastify     | Web server (receives HTTP requests)      |
| tRPC Router | Controller layer (routes calls to logic) |
| Drizzle ORM | Service/repository layer (queries DB)    |
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

// [GET BY ID]
// trpc.users.getUserById.query({ id: 1 }); 

// [CREATE]
// trpc.users.createUser.mutate({
//   fullName: "John Doe",
//   email: "john@example.com",
//   password: "hashed_password",
//   role: "admin"
// });

const appRouter = trpcRouter({
  users: usersRouter
});

// In tRPC, the HTTP method is always POST by default
// if get error (Unsupported POST-request to query procedure)
// but to check with Postman interchangeable POST with GET
// http://localhost:4000/trpc/users.getUserById?input={"id":1}

app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext, allowPostForQueries: true }
});

app.get("/", async () => {
  return { message: "tRPC backend is running" };
});

app.listen({ port: 4000 }, () => {
  console.log("tRPC backend running on http://localhost:4000");
});

export type AppRouter = typeof appRouter;
