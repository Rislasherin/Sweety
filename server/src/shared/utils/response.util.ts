import { type Response } from "express";
import { HttpStatus } from "../constants/httpStatus.enum";

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string,
  statusCode: HttpStatus = HttpStatus.OK,
  pagination?: PaginationMeta,
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  };

  return res.status(statusCode).json(payload);
}
