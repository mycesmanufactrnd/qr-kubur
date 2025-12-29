import Fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { createContext, router as trpcRouter } from "./trpc.js";
import { usersRouter } from "./routers/usersRouter.js";

const app = Fastify();

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

app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter, createContext }
});

app.listen({ port: 4000 }, () => {
  console.log("tRPC backend running on http://localhost:4000");
});

export type AppRouter = typeof appRouter;
