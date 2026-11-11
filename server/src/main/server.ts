import type http from "node:http";
import { env } from "./config/env";
import { app } from "./app";
import { prisma } from "@infrastructure/database/PrismaClient";
import { logger } from "@infrastructure/logging/logger";

const PORT = env.PORT;
let server: http.Server | undefined;
let isShuttingDown = false;

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, `Received ${signal}. Gracefully shutting down...`);

  // Prevent hanging indefinitely if closure stalls
  const forceTimeout = setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  if (server) {
    server.close((closeErr) => {
      if (closeErr) {
        logger.error({ err: closeErr }, "Error closing HTTP server");
      }
      void (async () => {
        try {
          await prisma.$disconnect();
          logger.info("Prisma disconnected. Graceful server closure complete.");
          process.exit(exitCode);
        } catch (err) {
          logger.error({ err }, "Error during Prisma disconnection");
          process.exit(1);
        }
      })();
    });
  } else {
    try {
      await prisma.$disconnect();
    } catch (err) {
      logger.error({ err }, "Error during Prisma disconnection");
    }
    process.exit(exitCode);
  }
}

async function start(): Promise<void> {
  logger.info({ port: PORT, env: env.NODE_ENV }, "Sweety server initializing...");

  try {
    await prisma.$connect();
    logger.info("Database connection established successfully");

    server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: env.NODE_ENV }, `Sweety server listening on port ${PORT}`);
    });

    server.on("error", (error: Error) => {
      logger.error({ err: error }, "Server listener startup error");
      process.exit(1);
    });
  } catch (err) {
    logger.error({ err }, "Database connection failure during startup");
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "Unhandled Promise Rejection detected");
  void gracefulShutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error({ err: error }, "Uncaught Exception detected");
  void gracefulShutdown("uncaughtException", 1);
});

void start();
