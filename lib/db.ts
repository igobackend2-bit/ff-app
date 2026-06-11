// Prisma client singleton — prevents multiple instances in dev (hot reload)
// Skill #12

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * DB_DISABLED=1 — the database is known to be unreachable. Every Prisma call
 * throws immediately so API routes hit their proxy/fallback paths without
 * waiting on connection timeouts (which made every page feel stuck loading).
 */
function makeDisabledClient(): PrismaClient {
  const err = () => {
    throw new Error('DB_DISABLED: database intentionally offline — use fallback path');
  };
  return new Proxy({} as PrismaClient, {
    get(_t, prop) {
      // Allow harmless introspection (await-ability checks, console.log, etc.)
      if (prop === 'then' || prop === Symbol.toStringTag) return undefined;
      if (prop === '$disconnect' || prop === '$connect') return async () => {};
      // Model delegates: every method throws synchronously
      return new Proxy(err, {
        get: () => err,
        apply: () => err(),
      });
    },
  });
}

export const prisma =
  globalForPrisma.prisma ??
  (process.env['DB_DISABLED'] === '1'
    ? makeDisabledClient()
    : new PrismaClient({
        log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
      }));

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
