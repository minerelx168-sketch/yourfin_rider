import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: required('DATABASE_URL', 'mysql://yourfin:yourfin_pass@localhost:3306/yourfin_rider'),
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',
  fallbackAvgSpeedKmh: parseFloat(process.env.FALLBACK_AVG_SPEED_KMH ?? '25'),
  get isProd() {
    return this.nodeEnv === 'production';
  },
};
