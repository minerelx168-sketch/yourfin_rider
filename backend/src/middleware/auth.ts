import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyToken, type JwtPayload } from '../utils/jwt';
import { ApiError } from './error';

// ขยาย Request ให้มี req.user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** ต้องล็อกอิน (มี Bearer token ที่ถูกต้อง) */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Missing or invalid Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

/** ต้องมีสิทธิ์ตาม role ที่กำหนด (ใช้ต่อจาก requireAuth) */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new ApiError(401, 'Unauthenticated');
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
}
