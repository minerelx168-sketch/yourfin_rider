import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { ApiError } from './error';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|heic|heif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image files are allowed'));
    }
  },
});

export { UPLOAD_DIR };
