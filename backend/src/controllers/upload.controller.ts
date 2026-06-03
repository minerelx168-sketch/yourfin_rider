import type { Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError, asyncHandler } from '../middleware/error';

/**
 * อัปโหลดรูปหน้าร้าน (multipart/form-data, field name = "photo")
 * dev: เก็บไฟล์ลงโฟลเดอร์ uploads/ แล้วคืน absolute URL
 * prod: แนะนำเปลี่ยนไปเก็บบน S3/GCS (ดู README)
 */
export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded (expected field "photo")');
  const url = `${env.publicBaseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
});
