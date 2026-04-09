import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }]
        : [],
})

// Log slow queries in development
if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
    (prisma as any).$on('query', (e: any) => {
        if (e.duration > 100) {
            console.warn(`🐌 Slow query (${e.duration}ms):`, e.query?.substring(0, 120))
        }
    })
}

if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma
}
