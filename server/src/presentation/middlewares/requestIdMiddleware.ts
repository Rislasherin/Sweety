import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      requestId?: string;
    }
  }
}

const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

export function isValidRequestId(id: unknown): id is string {
  return typeof id === "string" && VALID_REQUEST_ID_REGEX.test(id.trim());
}

export function requestIdMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incomingId = req.headers["x-request-id"];
    const idToValidate = Array.isArray(incomingId) ? incomingId[0] : incomingId;

    const requestId = isValidRequestId(idToValidate) ? idToValidate.trim() : randomUUID();

    req.id = requestId;
    req.requestId = requestId;

    res.setHeader("X-Request-Id", requestId);

    next();
  };
}
