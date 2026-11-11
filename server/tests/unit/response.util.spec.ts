import { describe, it, expect, vi } from "vitest";
import { type Response } from "express";
import { sendSuccess } from "@shared/utils/response.util";
import { HttpStatus } from "@shared/constants/httpStatus.enum";

describe("sendSuccess Unit Tests", () => {
  it("formats success response with default HTTP 200 status", () => {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock, json: jsonMock } as unknown as Response;

    const data = { id: "123", name: "Test" };
    sendSuccess(res, data, "Fetched successfully");

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.OK);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Fetched successfully",
      data,
    });
  });

  it("applies custom status code such as HTTP 201 CREATED", () => {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock, json: jsonMock } as unknown as Response;

    const data = { id: "new-id" };
    sendSuccess(res, data, "Created successfully", HttpStatus.CREATED);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Created successfully",
      data,
    });
  });

  it("includes pagination metadata when provided", () => {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock, json: jsonMock } as unknown as Response;

    const items = [1, 2, 3];
    const pagination = {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };

    sendSuccess(res, items, "Page fetched", HttpStatus.OK, pagination);

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Page fetched",
      data: items,
      pagination,
    });
  });

  it("omits pagination property when pagination argument is undefined", () => {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock, json: jsonMock } as unknown as Response;

    sendSuccess(res, { key: "value" }, "Success message");

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Success message",
      data: { key: "value" },
    });
    const callArg = jsonMock.mock.calls[0][0];
    expect("pagination" in callArg).toBe(false);
  });
});
