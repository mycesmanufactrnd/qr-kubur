// @ts-nocheck
import { router as trpcRouter } from "../trpc.js";
import { activityLogsRouter } from "./activityLogsRouter.js";
import { authRouter } from "./authRouter.js";
import { donationRouter } from "./donationRouter.js";
import { notificationRouter } from "./notificationRouter.js";
import { organisationRouter } from "./organisationRouter.js";
import { organisationTypeRouter } from "./organisationTypeRouter.js";
import { paymentFieldRouter } from "./paymentFieldRouter.js";
import { paymentPlatformRouter } from "./paymentPlatformRouter.js";
import { permissionRouter } from "./permissionRouter.js";
import { suggestionRouter } from "./suggestionRouter.js";
import { surahRouter } from "./surahRouter.js";
import { tahfizRouter } from "./tahfizRouter.js";
import { tahlilRequestRouter } from "./tahlilRequestRouter.js";
import { usersRouter } from "./usersRouter.js";
import { graveRouter } from "./graveRouter.js";
import { heritageRouter } from "./heritageRouter.js";
import { visitLogsRouter } from "./visitLogsRouter.js";
import { organisationPaymentConfigRouter } from "./organisationPaymentConfigRouter.js";
import { deadPersonRouter } from "./deadpersonRouter.js";
import { tahfizPaymentConfigRouter } from "./tahfizPaymentConfigRouter.js";
import { dashboardRouter } from "./dashboardRouter.js";
import { toyyibPayRouter } from "./toyyibPayRouter.js";
import { runningNoRouter } from "./runningNoRouter.js";
import { billplzRouter } from "./billplzRouter.js";
import { mosqueRouter } from "./mosqueRouter.js";
import { activityPostRouter } from "./activityPostRouter.js";
import { islamicEventRouter } from "./islamicEventRouter.js";
import { waqfProjectRouter } from "./waqfProjectRouter.js";
import { ollamaRouter } from "./ollamaRouter.js";
import { deathCharityRouter } from "./deathCharityRouter.js";
import { deathCharityMemberRouter } from "./deathCharityMemberRouter.js";
import { deathCharityClaimRouter } from "./deathCharityClaimRouter.js";
import { deathCharityPaymentRouter } from "./deathCharityPaymentRouter.js";
import { quotationRouter } from "./quotationRouter.js";
import { googleRouter } from "./googleRouter.js";
import { tempOrganisationRouter } from "./tempOrganisationRouter.js";
import { paymentDistributionRouter } from "./paymentDistributionRouter.js";
import { ganttchartRouter } from "./ganttchartRouter.js";
import { paymentComparisonRouter } from "./paymentComparisonRouter.js";
import { financialReportRouter } from "./financialReportRouter.js";
import { collectionTreeRouter } from "./collectionTreeRouter.js";
import { qariahNotificationRouter } from "./qariahNotificationRouter.js";
import { jenazahCaseRouter } from "./jenazahCaseRouter.js";

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
  collectionTree: collectionTreeRouter,
  qariahNotification: qariahNotificationRouter,
  jenazahCase: jenazahCaseRouter,
});

export type AppRouter = typeof appRouter;
