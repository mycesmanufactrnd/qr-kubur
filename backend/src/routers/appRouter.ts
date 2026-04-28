import { router as trpcRouter } from "../trpc.ts";
import { activityLogsRouter } from "./activityLogsRouter.ts";
import { authRouter } from "./authRouter.ts";
import { donationRouter } from "./donationRouter.ts";
import { notificationRouter } from "./notificationRouter.ts";
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
import { graveRouter } from "./graveRouter.ts";
import { heritageRouter } from "./heritageRouter.ts";
import { visitLogsRouter } from "./visitLogsRouter.ts";
import { organisationPaymentConfigRouter } from "./organisationPaymentConfigRouter.ts";
import { deadPersonRouter } from "./deadpersonRouter.ts";
import { tahfizPaymentConfigRouter } from "./tahfizPaymentConfigRouter.ts";
import { dashboardRouter } from "./dashboardRouter.ts";
import { toyyibPayRouter } from "./toyyibPayRouter.ts";
import { runningNoRouter } from "./runningNoRouter.ts";
import { billplzRouter } from "./billplzRouter.ts";
import { mosqueRouter } from "./mosqueRouter.ts";
import { activityPostRouter } from "./activityPostRouter.ts";
import { islamicEventRouter } from "./islamicEventRouter.js";
import { waqfProjectRouter } from "./waqfProjectRouter.ts";
import { ollamaRouter } from "./ollamaRouter.ts";
import { deathCharityRouter } from "./deathCharityRouter.ts";
import { deathCharityMemberRouter } from "./deathCharityMemberRouter.ts";
import { deathCharityClaimRouter } from "./deathCharityClaimRouter.ts";
import { deathCharityPaymentRouter } from "./deathCharityPaymentRouter.ts";
import { quotationRouter } from "./quotationRouter.ts";
import { googleRouter } from "./googleRouter.ts";
import { tempOrganisationRouter } from "./tempOrganisationRouter.ts";
import { paymentDistributionRouter } from "./paymentDistributionRouter.ts";
import { ganttchartRouter } from "./ganttchartRouter.ts";
import { paymentComparisonRouter } from "./paymentComparisonRouter.ts";
import { financialReportRouter } from "./financialReportRouter.ts";

export const appRouter = trpcRouter({
  ollama: ollamaRouter,
  auth: authRouter,
  google: googleRouter,
  tempOrganisation: tempOrganisationRouter,
  runningNo: runningNoRouter,
  toyyibPay: toyyibPayRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
  permission: permissionRouter,
  paymentDistribution: paymentDistributionRouter, 
  paymentPlatform: paymentPlatformRouter, 
  paymentField: paymentFieldRouter, 
  surah: surahRouter,
  tahfiz: tahfizRouter,
  tahfizPaymentConfig: tahfizPaymentConfigRouter,
  organisation: organisationRouter,
  organisationPaymentConfig: organisationPaymentConfigRouter,
  organisationType: organisationTypeRouter,
  grave: graveRouter,
  heritage: heritageRouter,
  suggestion: suggestionRouter,
  donation: donationRouter,
  tahlilRequest: tahlilRequestRouter,
  activityLogs: activityLogsRouter,
  visitLogs: visitLogsRouter,
  notification: notificationRouter,
  deadperson: deadPersonRouter,
  billplz: billplzRouter,
  mosque: mosqueRouter,
  activityPost: activityPostRouter,
  islamicEvent: islamicEventRouter,
  waqfProject: waqfProjectRouter,
  deathCharity: deathCharityRouter,
  deathCharityMember: deathCharityMemberRouter,
  deathCharityClaim: deathCharityClaimRouter,
  deathCharityPayment: deathCharityPaymentRouter,
  quotation: quotationRouter,
  ganttchart: ganttchartRouter,
  paymentComparison: paymentComparisonRouter,
  financialReport: financialReportRouter,
});

export type AppRouter = typeof appRouter;
