import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma, prisma } from './lib/prisma';

async function main() {
  // ตรวจการเชื่อมต่อฐานข้อมูลก่อนเริ่มรับ request
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`🚀 YourFin Rider API listening on http://localhost:${env.port}`);
    console.log(`   env=${env.nodeEnv}  maps=${env.googleMapsApiKey ? 'google' : 'haversine-fallback'}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(async (err) => {
  console.error('Fatal startup error:', err);
  await disconnectPrisma();
  process.exit(1);
});
