import "reflect-metadata";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";
import { prisma } from "@infrastructure/database/PrismaClient";
import { PrismaUserRepository } from "@infrastructure/repositories/PrismaUserRepository";
import { PrismaReadingRepository } from "@infrastructure/repositories/PrismaReadingRepository";
import { BcryptService } from "@infrastructure/services/BcryptService";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";
import { RegisterUserUseCase } from "@application/use-cases/auth/implementations/RegisterUserUseCase";
import { LoginUserUseCase } from "@application/use-cases/auth/implementations/LoginUserUseCase";
import { CreateReadingUseCase } from "@application/use-cases/reading/implementations/CreateReadingUseCase";
import { GetUserReadingsUseCase } from "@application/use-cases/reading/implementations/GetUserReadingsUseCase";
import { GetReadingByIdUseCase } from "@application/use-cases/reading/implementations/GetReadingByIdUseCase";
import { UpdateReadingUseCase } from "@application/use-cases/reading/implementations/UpdateReadingUseCase";
import { DeleteReadingUseCase } from "@application/use-cases/reading/implementations/DeleteReadingUseCase";
import { GenerateDailyReportUseCase } from "@application/use-cases/report/implementations/GenerateDailyReportUseCase";
import { GenerateMonthToDateReportUseCase } from "@application/use-cases/report/implementations/GenerateMonthToDateReportUseCase";
import { GeneratePreviousMonthReportUseCase } from "@application/use-cases/report/implementations/GeneratePreviousMonthReportUseCase";
import { AuthController } from "@presentation/controllers/AuthController";
import { ReadingController } from "@presentation/controllers/ReadingController";
import { ReportController } from "@presentation/controllers/ReportController";
import { createAuthRouter } from "@presentation/routes/auth.routes";
import { createReadingRouter } from "@presentation/routes/reading.routes";
import { createReportRouter } from "@presentation/routes/report.routes";
import { createAuthMiddleware } from "@presentation/middlewares/authMiddleware";
import { errorHandler } from "@presentation/middlewares/errorMiddleware";
import { requestIdMiddleware } from "@presentation/middlewares/requestIdMiddleware";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";

export interface AppDependencies {
  userRepository?: IUserRepository;
  readingRepository?: IReadingRepository;
  passwordService?: IPasswordService;
  tokenService?: ITokenService;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const app = express();

  app.use(requestIdMiddleware());
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(HttpStatus.OK).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Composition root - instantiate and wire dependencies
  const userRepository = dependencies.userRepository ?? new PrismaUserRepository(prisma);
  const readingRepository = dependencies.readingRepository ?? new PrismaReadingRepository(prisma);
  const passwordService = dependencies.passwordService ?? new BcryptService();
  const tokenService =
    dependencies.tokenService ??
    new JwtTokenService({
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    });

  // Auth use cases & controller
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordService);
  const loginUserUseCase = new LoginUserUseCase(userRepository, passwordService, tokenService);
  const authController = new AuthController(registerUserUseCase, loginUserUseCase);
  const authMiddleware = createAuthMiddleware(tokenService);

  // Reading use cases & controller
  const createReadingUseCase = new CreateReadingUseCase(readingRepository);
  const getUserReadingsUseCase = new GetUserReadingsUseCase(readingRepository);
  const getReadingByIdUseCase = new GetReadingByIdUseCase(readingRepository);
  const updateReadingUseCase = new UpdateReadingUseCase(readingRepository);
  const deleteReadingUseCase = new DeleteReadingUseCase(readingRepository);

  const readingController = new ReadingController(
    createReadingUseCase,
    getUserReadingsUseCase,
    getReadingByIdUseCase,
    updateReadingUseCase,
    deleteReadingUseCase,
  );

  // Report use cases & controller
  const generateDailyReportUseCase = new GenerateDailyReportUseCase(readingRepository);
  const generateMonthToDateReportUseCase = new GenerateMonthToDateReportUseCase(readingRepository);
  const generatePreviousMonthReportUseCase = new GeneratePreviousMonthReportUseCase(
    readingRepository,
  );

  const reportController = new ReportController(
    generateDailyReportUseCase,
    generateMonthToDateReportUseCase,
    generatePreviousMonthReportUseCase,
  );

  // Mount routes
  app.use("/api/auth", createAuthRouter(authController, authMiddleware));
  app.use("/api/readings", createReadingRouter(readingController, authMiddleware));
  app.use("/api/reports", createReportRouter(reportController, authMiddleware));

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: Messages.ERROR.ROUTE_NOT_FOUND,
    });
  });

  // Centralized error handling middleware (registered after routes)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
