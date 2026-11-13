import { type Request, type Response } from "express";
import { type ICreateReadingUseCase } from "@application/use-cases/reading/interfaces/ICreateReadingUseCase";
import { type IGetUserReadingsUseCase } from "@application/use-cases/reading/interfaces/IGetUserReadingsUseCase";
import { type IGetReadingByIdUseCase } from "@application/use-cases/reading/interfaces/IGetReadingByIdUseCase";
import { type IUpdateReadingUseCase } from "@application/use-cases/reading/interfaces/IUpdateReadingUseCase";
import { type IDeleteReadingUseCase } from "@application/use-cases/reading/interfaces/IDeleteReadingUseCase";
import { type CreateReadingRequestDTO } from "@application/dtos/reading/Request/CreateReadingRequestDTO";
import { type UpdateReadingRequestDTO } from "@application/dtos/reading/Request/UpdateReadingRequestDTO";
import { asyncHandler } from "@shared/utils/asyncHandler.util";
import { sendSuccess } from "@shared/utils/response.util";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";

export class ReadingController {
  constructor(
    private readonly _createReadingUseCase: ICreateReadingUseCase,
    private readonly _getUserReadingsUseCase: IGetUserReadingsUseCase,
    private readonly _getReadingByIdUseCase: IGetReadingByIdUseCase,
    private readonly _updateReadingUseCase: IUpdateReadingUseCase,
    private readonly _deleteReadingUseCase: IDeleteReadingUseCase,
  ) {}

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const dto = req.body as CreateReadingRequestDTO;
    const result = await this._createReadingUseCase.execute(userId, dto);

    sendSuccess(res, result, Messages.SUCCESS.READING_CREATED, HttpStatus.CREATED);
  });

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const dateStr = typeof req.query.date === "string" ? req.query.date : undefined;
    const page = req.query.page !== undefined ? Number(req.query.page) : 1;
    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 20;

    const result = await this._getUserReadingsUseCase.execute(userId, {
      date: dateStr,
      page,
      limit,
    });

    sendSuccess(
      res,
      result.readings,
      Messages.SUCCESS.READINGS_RETRIEVED,
      HttpStatus.OK,
      result.pagination,
    );
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this._getReadingByIdUseCase.execute(userId, id);

    sendSuccess(res, result, Messages.SUCCESS.READING_RETRIEVED, HttpStatus.OK);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const dto = req.body as UpdateReadingRequestDTO;
    const result = await this._updateReadingUseCase.execute(userId, id, dto);

    sendSuccess(res, result, Messages.SUCCESS.READING_UPDATED, HttpStatus.OK);
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this._deleteReadingUseCase.execute(userId, id);

    sendSuccess(res, null, Messages.SUCCESS.READING_DELETED, HttpStatus.OK);
  });
}
