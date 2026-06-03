import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

/** ข้อผิดพลาดที่รู้ค่าสถานะ HTTP ชัดเจน */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** ห่อ async handler เพื่อส่ง error ไปยัง error middleware อัตโนมัติ */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }
  // Prisma unique-constraint
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
