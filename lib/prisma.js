import { PrismaClient } from '@prisma/client';

const log = ['query', 'error', 'warn'];

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? log : ['error'],
});

const prismaShutdown = async () => {
  await prisma.$disconnect();
};

process.on('SIGINT', prismaShutdown);
process.on('SIGTERM', prismaShutdown);

export default prisma;
