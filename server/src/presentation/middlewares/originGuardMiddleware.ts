import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { ErrorCode } from "@shared/constants/errorCode.enum";
import { REFRESH_COOKIE_NAME } from "@presentation/controllers/AuthController";

export interface OriginGuardOptions {
  allowedOrigins: string[];
  isProduction?: boolean;
}

export function parseAllowedOrigins(corsOriginConfig?: string): string[] {
  const isDevOrTest = process.env.NODE_ENV !== "production";
  const defaultOrigins = isDevOrTest
    ? "http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173"
    : "";
  const raw = corsOriginConfig ?? defaultOrigins;
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);
}

/**
 * Strict Origin and Referer validation middleware for state-changing endpoints
 * (such as POST /api/auth/refresh and POST /api/auth/logout).
 *
 * Security Policy:
 * 1. If an Origin header is present, it must match the allowed origins whitelist.
 * 2. If an Origin header is absent but a Referer header is present, its origin must match the whitelist.
 * 3. If neither header is present:
 *    - In production, cookie-authenticated requests are strictly rejected with 403 Forbidden.
 *    - In development/testing, non-browser clients (e.g. automated test runners) without an Origin
 *      header are permitted.
 *    - Pure programmatic API requests without cookies (e.g. mobile apps passing tokens strictly via JSON body)
 *      are permitted because browser-based CSRF attacks cannot occur without cookies.
 */
export function createOriginGuard(options: OriginGuardOptions): RequestHandler {
  const { allowedOrigins, isProduction = process.env.NODE_ENV === "production" } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const rawOrigin = req.headers.origin;
    const rawReferer = req.headers.referer;

    // 1. Direct Origin header verification
    if (rawOrigin && typeof rawOrigin === "string") {
      const normalizedOrigin = rawOrigin.trim().replace(/\/+$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return next();
      }
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden: Untrusted origin",
        errorCode: ErrorCode.FORBIDDEN,
      });
      return;
    }

    // 2. Referer header fallback verification
    if (rawReferer && typeof rawReferer === "string") {
      try {
        const refererUrl = new URL(rawReferer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`.replace(/\/+$/, "");
        if (allowedOrigins.includes(refererOrigin)) {
          return next();
        }
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: "Forbidden: Untrusted referer origin",
          errorCode: ErrorCode.FORBIDDEN,
        });
        return;
      } catch {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: "Forbidden: Malformed referer header",
          errorCode: ErrorCode.FORBIDDEN,
        });
        return;
      }
    }

    // 3. Safe policy evaluation for requests without Origin or Referer
    const hasRefreshCookie = Boolean(
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME],
    );

    if (isProduction && hasRefreshCookie) {
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden: Origin or Referer header required for cookie-authenticated requests",
        errorCode: ErrorCode.FORBIDDEN,
      });
      return;
    }

    next();
  };
}
