'use server'

import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { ACTIVE_EVENT_STATUSES, COMPLETED_EVENT_STATUSES } from '@/lib/event-status'

// ==================== Client Actions ====================

const getCachedClientsWithStats = unstable_cache(
    async () => {
        // Run 3 lightweight parallel queries instead of 1 massive deep include
        const [clients, eventCountsByClient, revenueByClient] = await Promise.all([
            // 1. Get client basic data only (no includes)
            prisma.client.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    createdAt: true,
                },
                orderBy: { name: 'asc' }
            }),

            // 2. Count events per client grouped by status
            prisma.event.groupBy({
                by: ['clientId', 'status'],
                _count: { id: true },
                where: { clientId: { not: null } }
            }),

            // 3. Sum revenue per client using raw aggregation
            prisma.$queryRaw<{ clientId: string; totalSpent: number }[]>`
                SELECT e."clientId" as "clientId", 
                       COALESCE(SUM(ei.quantity * p."priceUnit"), 0)::float as "totalSpent"
                FROM "Event" e
                JOIN "EventItem" ei ON ei."eventId" = e.id
                JOIN "Product" p ON p.id = ei."productId"
                WHERE e."clientId" IS NOT NULL
                GROUP BY e."clientId"
            `
        ])

        // Build lookup maps for O(1) access
        const statsMap = new Map<string, { totalEvents: number; activeEvents: number; completedEvents: number }>()
        for (const row of eventCountsByClient) {
            if (!row.clientId) continue
            const existing = statsMap.get(row.clientId) || { totalEvents: 0, activeEvents: 0, completedEvents: 0 }
            existing.totalEvents += row._count.id
            if (ACTIVE_EVENT_STATUSES.includes(row.status as (typeof ACTIVE_EVENT_STATUSES)[number])) {
                existing.activeEvents += row._count.id
            }
            if (COMPLETED_EVENT_STATUSES.includes(row.status as (typeof COMPLETED_EVENT_STATUSES)[number])) {
                existing.completedEvents += row._count.id
            }
            statsMap.set(row.clientId, existing)
        }

        const revenueMap = new Map<string, number>()
        for (const row of revenueByClient) {
            revenueMap.set(row.clientId, row.totalSpent)
        }

        // Combine
        const clientsWithStats = clients.map(client => ({
            ...client,
            stats: {
                totalEvents: statsMap.get(client.id)?.totalEvents ?? 0,
                activeEvents: statsMap.get(client.id)?.activeEvents ?? 0,
                completedEvents: statsMap.get(client.id)?.completedEvents ?? 0,
                totalSpent: revenueMap.get(client.id) ?? 0,
            }
        }))

        return clientsWithStats
    },
    ['clients-with-stats'],
    { revalidate: 30 }
)

export async function getAllClientsWithStats() {
    try {
        const clientsWithStats = await getCachedClientsWithStats()
        return { success: true, data: clientsWithStats }
    } catch (error) {
        console.error('Error fetching clients:', error)
        return { success: false, error: 'Error al obtener clientes' }
    }
}

export async function getClientById(id: string) {
    try {
        const client = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                createdAt: true,
                events: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        status: true,
                        items: {
                            select: {
                                quantity: true,
                                product: {
                                    select: {
                                        priceUnit: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        startDate: 'desc'
                    }
                }
            }
        })

        if (!client) {
            return { success: false, error: 'Cliente no encontrado' }
        }

        // Calculate stats
        const totalEvents = client.events.length
        const activeEvents = client.events.filter((e) =>
            ACTIVE_EVENT_STATUSES.includes(e.status as (typeof ACTIVE_EVENT_STATUSES)[number])
        ).length
        const completedEvents = client.events.filter((e) =>
            COMPLETED_EVENT_STATUSES.includes(e.status as (typeof COMPLETED_EVENT_STATUSES)[number])
        ).length

        const totalSpent = client.events.reduce((acc: number, event) => {
            const eventTotal = event.items.reduce((sum: number, item) =>
                sum + (item.quantity * item.product.priceUnit), 0
            )
            return acc + eventTotal
        }, 0)

        return {
            success: true,
            data: {
                ...client,
                stats: {
                    totalEvents,
                    activeEvents,
                    completedEvents,
                    totalSpent
                }
            }
        }
    } catch (error) {
        console.error('Error fetching client:', error)
        return { success: false, error: 'Error al obtener cliente' }
    }
}
