import { router } from "../init";
import { authRouter } from "./auth";
import { adminRouter } from "./admin";
import { dashboardRouter } from "./dashboard";
import { courseRouter } from "./course";
import { batchRouter } from "./batch";
import { scheduleRouter } from "./schedule";
import { curriculumRouter } from "./curriculum";
import { learningRouter } from "./learning";
import { trainerRouter } from "./trainer";
import { attendanceRouter } from "./attendance";
import { crmRouter } from "./crm";
import { financeRouter } from "./finance";
import { paymentRouter } from "./payment";
import { examRouter } from "./exam";
import { certificateRouter } from "./certificate";
import { placementRouter } from "./placement";
import { staffErpRouter } from "./staff-erp";
import { analyticsRouter } from "./analytics";
import { notificationRouter } from "./notification";
import { systemRouter } from "./system";
import { bulkCallingRouter } from "./bulk-calling";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
  course: courseRouter,
  batch: batchRouter,
  schedule: scheduleRouter,
  curriculum: curriculumRouter,
  learning: learningRouter,
  trainer: trainerRouter,
  attendance: attendanceRouter,
  crm: crmRouter,
  finance: financeRouter,
  payment: paymentRouter,
  exam: examRouter,
  certificate: certificateRouter,
  placement: placementRouter,
  staffErp: staffErpRouter,
  analytics: analyticsRouter,
  notifications: notificationRouter,
  system: systemRouter,
  bulkCalling: bulkCallingRouter,
});


export type AppRouter = typeof appRouter;
