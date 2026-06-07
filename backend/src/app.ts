import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { UPLOAD_DIR } from './middleware/upload';
import apiRouter from './routes';

export function createApp() {
  const app = express();

  // Behind a reverse proxy / load balancer in production (nginx, Render, Railway,
  // Fly, etc.) so rate-limiting and req.ip read the real client via X-Forwarded-For.
  if (env.isProd) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan('dev'));

  // rate limit ทั่วไป (กัน brute-force / abuse)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // ไฟล์รูปที่อัปโหลด (dev local storage)
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
