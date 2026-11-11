import { Router, type RequestHandler } from "express";
import { type ReportController } from "../controllers/ReportController";
import { validateDto } from "../middlewares/validateDto";
import { GetReportQueryDTO } from "@application/dtos/report/Request/GetReportQueryDTO";

export function createReportRouter(
  reportController: ReportController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // All report routes require authentication
  router.use(authMiddleware);

  router.get("/daily", validateDto(GetReportQueryDTO, "query"), reportController.getDaily);

  router.get(
    "/month-to-date",
    validateDto(GetReportQueryDTO, "query"),
    reportController.getMonthToDate,
  );

  router.get(
    "/previous-month",
    validateDto(GetReportQueryDTO, "query"),
    reportController.getPreviousMonth,
  );

  return router;
}
