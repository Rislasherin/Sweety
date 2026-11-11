import { describe, it, expect, vi } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import { asyncHandler } from "@shared/utils/asyncHandler.util";

describe("asyncHandler Unit Tests", () => {
  it("executes successful async handler without calling next with error", async () => {
    const req = {} as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const handler = asyncHandler(async (_req, r) => {
      r.status(200).json({ ok: true });
    });

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("catches rejected promises and forwards error to next()", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    const expectedError = new Error("Async failure");

    const handler = asyncHandler(async () => {
      throw expectedError;
    });

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it("catches synchronous exceptions and forwards them to next()", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    const expectedError = new TypeError("Sync failure");

    const handler = asyncHandler(() => {
      throw expectedError;
    });

    handler(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
