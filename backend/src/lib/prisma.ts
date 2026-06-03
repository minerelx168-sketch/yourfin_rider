import { PrismaClient } from '@prisma/client';

// Single shared Prisma client (avoids exhausting the connection pool on hot reload)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
