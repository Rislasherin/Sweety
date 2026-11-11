import { type Request, type Response } from "express";
import { type IGenerateDailyReportUseCase } from "@application/use-cases/report/interfaces/IGenerateDailyReportUseCase";
import { type IGenerateMonthToDateReportUseCase } from "@application/use-cases/report/interfaces/IGenerateMonthToDateReportUseCase";
import { type IGeneratePreviousMonthReportUseCase } from "@application/use-cases/report/interfaces/IGeneratePreviousMonthReportUseCase";
import { asyncHandler } from "@shared/utils/asyncHandler.util";
import { sendSuccess } from "@shared/utils/response.util";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";

export class ReportController {
  constructor(
    private readonly _generateDailyReportUseCase: IGenerateDailyReportUseCase,
    private readonly _generateMonthToDateReportUseCase: IGenerateMonthToDateReportUseCase,
    private readonly _generatePreviousMonthReportUseCase: IGeneratePreviousMonthReportUseCase,
  ) {}

  getDaily = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const date = req.query.date as string;
    const report = await this._generateDailyReportUseCase.execute(userId, date);

    sendSuccess(res, report, Messages.SUCCESS.DAILY_REPORT_RETRIEVED, HttpStatus.OK);
  });

  getMonthToDate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const date = req.query.date as string;
    const report = await this._generateMonthToDateReportUseCase.execute(userId, date);

    sendSuccess(res, report, Messages.SUCCESS.MONTH_TO_DATE_REPORT_RETRIEVED, HttpStatus.OK);
  });

  getPreviousMonth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const date = req.query.date as string;
    const report = await this._generatePreviousMonthReportUseCase.execute(userId, date);

    sendSuccess(res, report, Messages.SUCCESS.PREVIOUS_MONTH_REPORT_RETRIEVED, HttpStatus.OK);
  });
}
