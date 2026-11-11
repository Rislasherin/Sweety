import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function createAuthMiddleware(tokenService: ITokenService): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: Messages.AUTH.TOKEN_MISSING,
      });
      return;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: Messages.AUTH.TOKEN_MISSING,
      });
      return;
    }

    try {
      const payload = tokenService.verify(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
      };
      next();
    } catch {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: Messages.AUTH.TOKEN_INVALID_OR_EXPIRED,
      });
    }
  };
}
