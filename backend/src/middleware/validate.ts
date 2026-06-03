import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Middleware ตรวจ/แปลงข้อมูลด้วย zod แล้วเขียนค่าที่ผ่านการแปลงกลับเข้า req[source]
 * ความผิดพลาดจะถูกส่งต่อให้ errorHandler (ตอบ 400 พร้อมรายละเอียด)
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // query/params เป็น read-only ใน Express 5 บางเวอร์ชัน — assign แบบปลอดภัย
    Object.assign(req[source] as object, result.data);
    if (source === 'body') req.body = result.data;
    next();
  };
}
