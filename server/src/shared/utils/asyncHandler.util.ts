import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

export type AsyncRequestHandler<Req = Request, Res = Response> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => Promise<unknown> | unknown;

export function asyncHandler<Req extends Request = Request, Res extends Response = Response>(
  fn: AsyncRequestHandler<Req, Res>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}
