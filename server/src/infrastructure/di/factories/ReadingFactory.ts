import { type PrismaClient } from "@prisma/client";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { PrismaReadingRepository } from "@infrastructure/repositories/PrismaReadingRepository";
import { CreateReadingUseCase } from "@application/use-cases/reading/implementations/CreateReadingUseCase";
import { GetUserReadingsUseCase } from "@application/use-cases/reading/implementations/GetUserReadingsUseCase";
import { GetReadingByIdUseCase } from "@application/use-cases/reading/implementations/GetReadingByIdUseCase";
import { UpdateReadingUseCase } from "@application/use-cases/reading/implementations/UpdateReadingUseCase";
import { DeleteReadingUseCase } from "@application/use-cases/reading/implementations/DeleteReadingUseCase";
import { GenerateDailyReportUseCase } from "@application/use-cases/report/implementations/GenerateDailyReportUseCase";
import { GenerateMonthToDateReportUseCase } from "@application/use-cases/report/implementations/GenerateMonthToDateReportUseCase";
import { GeneratePreviousMonthReportUseCase } from "@application/use-cases/report/implementations/GeneratePreviousMonthReportUseCase";
import { ReadingController } from "@presentation/controllers/ReadingController";
import { ReportController } from "@presentation/controllers/ReportController";

export interface ReadingFactoryOverrides {
  readingRepository?: IReadingRepository;
  readingController?: ReadingController;
  reportController?: ReportController;
}

export class ReadingFactory {
  private readonly _readingRepository: IReadingRepository;
  private readonly _createReadingUseCase: CreateReadingUseCase;
  private readonly _getUserReadingsUseCase: GetUserReadingsUseCase;
  private readonly _getReadingByIdUseCase: GetReadingByIdUseCase;
  private readonly _updateReadingUseCase: UpdateReadingUseCase;
  private readonly _deleteReadingUseCase: DeleteReadingUseCase;
  private readonly _generateDailyReportUseCase: GenerateDailyReportUseCase;
  private readonly _generateMonthToDateReportUseCase: GenerateMonthToDateReportUseCase;
  private readonly _generatePreviousMonthReportUseCase: GeneratePreviousMonthReportUseCase;
  private readonly _readingController: ReadingController;
  private readonly _reportController: ReportController;

  constructor(prisma: PrismaClient, overrides: ReadingFactoryOverrides = {}) {
    this._readingRepository = overrides.readingRepository ?? new PrismaReadingRepository(prisma);

    this._createReadingUseCase = new CreateReadingUseCase(this._readingRepository);
    this._getUserReadingsUseCase = new GetUserReadingsUseCase(this._readingRepository);
    this._getReadingByIdUseCase = new GetReadingByIdUseCase(this._readingRepository);
    this._updateReadingUseCase = new UpdateReadingUseCase(this._readingRepository);
    this._deleteReadingUseCase = new DeleteReadingUseCase(this._readingRepository);

    this._readingController =
      overrides.readingController ??
      new ReadingController(
        this._createReadingUseCase,
        this._getUserReadingsUseCase,
        this._getReadingByIdUseCase,
        this._updateReadingUseCase,
        this._deleteReadingUseCase,
      );

    this._generateDailyReportUseCase = new GenerateDailyReportUseCase(this._readingRepository);
    this._generateMonthToDateReportUseCase = new GenerateMonthToDateReportUseCase(
      this._readingRepository,
    );
    this._generatePreviousMonthReportUseCase = new GeneratePreviousMonthReportUseCase(
      this._readingRepository,
    );

    this._reportController =
      overrides.reportController ??
      new ReportController(
        this._generateDailyReportUseCase,
        this._generateMonthToDateReportUseCase,
        this._generatePreviousMonthReportUseCase,
      );
  }

  getReadingRepository(): IReadingRepository {
    return this._readingRepository;
  }

  getReadingController(): ReadingController {
    return this._readingController;
  }

  getReportController(): ReportController {
    return this._reportController;
  }
}
