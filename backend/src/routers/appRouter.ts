// In tRPC, the HTTP method is always POST by default
// if get error (Unsupported POST-request to query procedure)
// but to check with Postman interchangeable POST with GET

import { router as trpcRouter } from "../trpc.ts";
import { authRouter } from "./authRouter.ts";
import { surahRouter } from "./surahRouter.ts";
import { usersRouter } from "./usersRouter.ts";

export const appRouter = trpcRouter({
  auth: authRouter,
  users: usersRouter,
  surah: surahRouter,
});

export type AppRouter = typeof appRouter;
