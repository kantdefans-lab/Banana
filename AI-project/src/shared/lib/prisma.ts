// src/shared/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// ✅ v5 标准写法：括号里什么都不用传，它会自动读取 .env 里的 DATABASE_URL
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;