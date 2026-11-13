import "reflect-metadata";
import express, { type Express, type Request, type Response, type RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { Container } from "@infrastructure/di/Container";
import { type AuthController } from "@presentation/controllers/AuthController";
import { type ReadingController } from "@presentation/controllers/ReadingController";
import { type ReportController } from "@presentation/controllers/ReportController";
import { createAuthRouter } from "@presentation/routes/auth.routes";
import { createReadingRouter } from "@presentation/routes/reading.routes";
import { createReportRouter } from "@presentation/routes/report.routes";
import { errorHandler } from "@presentation/middlewares/errorMiddleware";
import { requestIdMiddleware } from "@presentation/middlewares/requestIdMiddleware";
import {
  createOriginGuard,
  parseAllowedOrigins,
} from "@presentation/middlewares/originGuardMiddleware";
import { env } from "@main/config/env";
import { AppError } from "@shared/errors/AppError";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";
import { Messages } from "@shared/constants/messages.constants";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IReadingRepository } from "@domain/repositories/IReadingRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";

export interface AppDependencies {
  container?: Container;
  authController?: AuthController;
  authMiddleware?: RequestHandler;
  originGuard?: RequestHandler;
  corsOrigin?: string;
  readingController?: ReadingController;
  reportController?: ReportController;
  userRepository?: IUserRepository;
  readingRepository?: IReadingRepository;
  passwordService?: IPasswordService;
  tokenService?: ITokenService;
}

export { parseAllowedOrigins };

export function createApp(dependencies: AppDependencies = {}): Express {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(dependencies.corsOrigin);

  // Security headers & Request ID tracking
  app.use(requestIdMiddleware());
  app.use(helmet());
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Non-browser or server-to-server requests have no origin header
        if (!requestOrigin) {
          return callback(null, true);
        }
        const normalized = requestOrigin.trim().replace(/\/+$/, "");
        if (allowedOrigins.includes(normalized)) {
          return callback(null, true);
        }
        return callback(
          new AppError("Not allowed by CORS", HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN),
        );
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(HttpStatus.OK).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Resolve dependencies from Infrastructure container
  let container = dependencies.container;
  if (!container) {
    if (
      dependencies.userRepository ||
      dependencies.readingRepository ||
      dependencies.passwordService ||
      dependencies.tokenService
    ) {
      container = new Container({
        userFactory: {
          userRepository: dependencies.userRepository,
        },
        authFactory: {
          userRepository: dependencies.userRepository,
          passwordService: dependencies.passwordService,
          accessTokenService: dependencies.tokenService,
        },
        readingFactory: {
          readingRepository: dependencies.readingRepository,
        },
      });
    } else {
      container = Container.getInstance();
    }
  }

  const authController = dependencies.authController ?? container.authController;
  const authMiddleware = dependencies.authMiddleware ?? container.authMiddleware;
  const originGuard =
    dependencies.originGuard ??
    createOriginGuard({
      allowedOrigins,
      isProduction: env.NODE_ENV === "production",
    });
  const readingController = dependencies.readingController ?? container.readingController;
  const reportController = dependencies.reportController ?? container.reportController;

  // Mount routes
  app.use("/api/auth", createAuthRouter(authController, authMiddleware, originGuard));
  app.use("/api/readings", createReadingRouter(readingController, authMiddleware));
  app.use("/api/reports", createReportRouter(reportController, authMiddleware));

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: Messages.ERROR.ROUTE_NOT_FOUND,
    });
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
