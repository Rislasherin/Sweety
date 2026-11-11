import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate, type ValidationError } from "class-validator";
import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";

export function validateDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  target: "body" | "query" = "body",
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = target === "query" ? req.query : (req.body ?? {});
    const dtoInstance = plainToInstance(dtoClass, data);

    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => ({
        field: err.property,
        message: err.constraints ? Object.values(err.constraints)[0] : "Invalid value",
      }));

      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: Messages.ERROR.VALIDATION_FAILED,
        errors: formattedErrors,
      });
      return;
    }

    if (target === "body") {
      req.body = dtoInstance;
    }
    next();
  };
}
