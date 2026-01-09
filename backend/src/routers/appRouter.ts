// In tRPC, the HTTP method is always POST by default
// if get error (Unsupported POST-request to query procedure)
// but to check with Postman interchangeable POST with GET

import { router as trpcRouter } from "../trpc.ts";
import { authRouter } from "./authRouter.ts";
import { donationRouter } from "./donationRouter.ts";
import { organisationRouter } from "./organisationRouter.ts";
import { organisationTypeRouter } from "./organisationTypeRouter.ts";
import { paymentFieldRouter } from "./paymentFieldRouter.ts";
import { paymentPlatformRouter } from "./paymentPlatformRouter.ts";
import { permissionRouter } from "./permissionRouter.ts";
import { suggestionRouter } from "./suggestionRouter.ts";
import { surahRouter } from "./surahRouter.ts";
import { tahfizRouter } from "./tahfizRouter.ts";
import { tahlilRequestRouter } from "./tahlilRequestRouter.ts";
import { usersRouter } from "./usersRouter.ts";

export const appRouter = trpcRouter({
  auth: authRouter,
  users: usersRouter,
  permission: permissionRouter,
  paymentPlatform: paymentPlatformRouter, 
  paymentField: paymentFieldRouter, 
  surah: surahRouter,
  tahfiz: tahfizRouter,
  organisation: organisationRouter,
  organisationType: organisationTypeRouter,
  suggestion: suggestionRouter,
  donation: donationRouter,
  tahlilRequest: tahlilRequestRouter,
});

export type AppRouter = typeof appRouter;
