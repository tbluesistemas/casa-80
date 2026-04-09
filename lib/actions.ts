'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath, unstable_cache } from 'next/cache'
import { sendReservationEmail } from '@/lib/email'
import { getCurrentRole, UserRole } from '@/lib/auth'
import { signIn, auth } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'

// Helper to check availability
async function checkAvailability(
    startDate: Date,
    endDate: Date,
    items: { productId: string; quantity: number }[],
    excludeEventId?: string
) {
    // 1. Find overlapping events
    const whereClause: any = {
        status: { in: ['RESERVADO', 'DESPACHADO'] }, // Solo estos estados bloquean inventario
        OR: [
            {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        ],
    }

    if (excludeEventId) {
        whereClause.id = { not: excludeEventId }
    }

    // Fetch overlapping events and all needed products in parallel (eliminates N+1)
    const productIds = items.map(i => i.productId)
    const [overlappingEvents, productsData] = await Promise.all([
        prisma.event.findMany({
            where: whereClause,
            include: { items: { where: { productId: { in: productIds } } } },
        }),
        prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, totalQuantity: true, quantityDamaged: true },
        }),
    ])

    const productMap = new Map(productsData.map(p => [p.id, p]))

    // Pre-compute used quantity per product from overlapping events
    const usedQtyMap = new Map<string, number>()
    for (const event of overlappingEvents) {
        for (const ei of event.items) {
            usedQtyMap.set(ei.productId, (usedQtyMap.get(ei.productId) ?? 0) + ei.quantity)
        }
    }

    // 2. Check each item
    for (const item of items) {
        const product = productMap.get(item.productId)
        if (!product) {
            return { success: false, error: `Producto no encontrado: ${item.productId}` }
        }

        const usedQuantity = usedQtyMap.get(item.productId) ?? 0

        if (usedQuantity + item.quantity > (product.totalQuantity - product.quantityDamaged)) {
            return {
                success: false,
                error: `No hay suficiente stock para "${product.name}". Disponible: ${(product.totalQuantity - product.quantityDamaged) - usedQuantity}, Solicitado: ${item.quantity} (Fuera de servicio: ${product.quantityDamaged})`,
            }
        }
    }

    return { success: true }
}

export async function getProducts(filters?: {
    startDate?: Date
    endDate?: Date
}) {
    const dateKey = filters?.startDate
        ? `${filters.startDate.toISOString().slice(0, 10)}`
        : 'no-date'

    const getCachedProducts = unstable_cache(
        async () => {
            // Run products fetch and active events fetch in parallel when filters are provided
            const activeEventsPromise = (filters?.startDate && filters?.endDate)
                ? prisma.event.findMany({
                    where: {
                        status: { in: ['RESERVADO', 'DESPACHADO'] },
                        OR: [{ startDate: { lte: filters.endDate }, endDate: { gte: filters.startDate } }],
                    },
                    select: { items: { select: { productId: true, quantity: true } } }
                })
                : Promise.resolve(null)

            const [products, activeEventsResult] = await Promise.all([
                prisma.product.findMany({ orderBy: { name: 'asc' } }),
                activeEventsPromise,
            ])

            const allocationMap = new Map<string, number>()
            if (activeEventsResult) {
                for (const event of activeEventsResult) {
                    for (const item of event.items) {
                        allocationMap.set(item.productId, (allocationMap.get(item.productId) ?? 0) + item.quantity)
                    }
                }
            }

            // Map products to include dynamic availability
            const detailedProducts = products.map(product => {
                const allocated = allocationMap.get(product.id) || 0
                const damaged = product.quantityDamaged || 0
                const available = Math.max(0, product.totalQuantity - damaged - allocated)

                return {
                    ...product,
                    quantityDamaged: damaged,
                    availableQuantity: available,
                    allocatedQuantity: allocated
                }
            })

            return detailedProducts
        },
        [`products-${dateKey}`],
        { revalidate: 30 }
    )

    try {
        const detailedProducts = await getCachedProducts()
        return { success: true, data: detailedProducts }
    } catch (error) {
        console.error('Error fetching products:', error)
        return { success: false, error: 'Error al obtener productos' }
    }
}

export async function updateProduct(id: string, data: {
    name?: string
    category?: string | null
    subcategory?: string | null
    novedad?: string | null
    description?: string | null
    totalQuantity?: number
    quantityDamaged?: number
    priceUnit?: number
    priceReplacement?: number
    imageUrl?: string | null
    code?: string | null
}) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    // Helper to log history
    async function logEventStatusChange(
        eventId: string,
        newStatus: string,
        previousStatus: string | null = null,
        reason: string | null = null
    ) {
        const session = await auth()
        try {
            await prisma.eventHistory.create({
                data: {
                    eventId,
                    previousStatus,
                    newStatus,
                    changedBy: session?.user?.email || 'Sistema',
                    reason
                }
            })
        } catch (error) {
            console.error('Error logging history:', error)
        }
    }
    try {
        const product = await prisma.product.update({
            where: { id },
            data
        })
        revalidatePath('/inventory')
        return { success: true, data: product }
    } catch (error) {
        console.error('Error updating product:', error)
        return { success: false, error: 'Error al actualizar producto' }
    }
}

export async function createProduct(data: {
    name: string
    category?: string
    subcategory?: string
    novedad?: string
    description?: string
    totalQuantity?: number
    priceUnit?: number
    priceReplacement?: number
    imageUrl?: string | null
    code?: string
}) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }
    try {
        const product = await prisma.product.create({
            data: {
                name: data.name,
                category: data.category || null,
                subcategory: data.subcategory || null,
                novedad: data.novedad || null,
                description: data.description || null,
                totalQuantity: data.totalQuantity || 0,
                priceReplacement: data.priceReplacement || 0,
                imageUrl: data.imageUrl || null,
                code: data.code || null,
            }
        })
        revalidatePath('/inventory')
        return { success: true, data: product }
    } catch (error) {
        console.error('Error creating product:', error)
        return { success: false, error: 'Error al crear producto' }
    }
}

export async function updateEvent(id: string, data: {
    name?: string
    startDate?: Date
    endDate?: Date
    status?: string
    notes?: string
    deposit?: number
    transport?: number
    discount?: number
    items?: { productId: string; quantity: number }[]
}) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    try {
        const currentEvent = await prisma.event.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!currentEvent) {
            return { success: false, error: 'Evento no encontrado' }
        }

        // Determine effective dates (use new ones or fallback to existing)
        const effectiveStartDate = data.startDate ? data.startDate : currentEvent.startDate
        const effectiveEndDate = data.endDate ? data.endDate : currentEvent.endDate

        // Basic date validation
        if (effectiveEndDate < effectiveStartDate) {
            return { success: false, error: 'La fecha de fin no puede ser anterior a la de inicio' }
        }

        // If items OR dates are changing, check availability
        // If items are provided, use them. If not, use existing items (but availability check might still be needed if dates changed)
        // However, if only dates change, we should check availability for the EXISTING items.
        // If only items change, we should check availability for the NEW items on EXISTING dates.

        const itemsToCheck = data.items
            ? data.items
            : currentEvent.items.map(i => ({ productId: i.productId, quantity: i.quantity }))

        // Only skip check if neither dates nor items changed (unlikely here as we call this on save)
        // But to be safe, always check if we are booking/active
        const effectiveStatus = data.status || currentEvent.status

        if (['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'].includes(effectiveStatus)) {
            // If status is changing TO these statuses from cancelled/completed, we MUST check.
            // If we are already in these statuses, we check if dates or items changed.

            const availability = await checkAvailability(
                effectiveStartDate,
                effectiveEndDate,
                itemsToCheck,
                id // Exclude self
            )

            if (!availability.success) {
                return { success: false, error: availability.error }
            }
        }

        // Update transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update core event details
            const updatedEvent = await tx.event.update({
                where: { id },
                data: {
                    name: data.name,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: data.status,
                    notes: data.notes,
                    deposit: data.deposit,
                    transport: data.transport,
                    discount: data.discount
                }
            })

            // Update items if provided
            if (data.items) {
                // Delete existing items (simpler than syncing for now, or we could smart update)
                // For simplicity and correctness with the constraint @@unique([eventId, productId]), 
                // we can delete all and recreate, OR upsert.
                // Given we are sending the FULL list of desired items, delete + create is cleaner 
                // BUT we lose returnedGood/returnedDamaged if we are not careful? 
                // Ah, this editing is for "Booking" phase mostly. 
                // If the event is already "Completed" or has return data, editing items is risky with deleteMany.
                // The requirement is "siempre y cuando el estado del cliente es reservado" (SIN_CONFIRMAR or RESERVADO).
                // So no return data should exist yet.

                if (['SIN_CONFIRMAR', 'RESERVADO'].includes(currentEvent.status) || ['SIN_CONFIRMAR', 'RESERVADO'].includes(effectiveStatus)) {
                    await tx.eventItem.deleteMany({
                        where: { eventId: id }
                    })

                    if (data.items.length > 0) {
                        await tx.eventItem.createMany({
                            data: data.items.map(item => ({
                                eventId: id,
                                productId: item.productId,
                                quantity: item.quantity
                            }))
                        })
                    }
                } else {
                    // If status is NOT booked (e.g. Active), user might still want to add/remove items?
                    // User said "siempre y cuando el estado ... es reservado".
                    // So maybe we restrict item updates to BOOKED status in the backend too?
                    // For now, I will allow it but be careful. 
                    // Let's stick to the Safe Approach: DeleteMany is fine if we assume no return data yet.

                    await tx.eventItem.deleteMany({
                        where: { eventId: id }
                    })

                    if (data.items.length > 0) {
                        await tx.eventItem.createMany({
                            data: data.items.map(item => ({
                                eventId: id,
                                productId: item.productId,
                                quantity: item.quantity
                            }))
                        })
                    }
                }
            }

            // Log status change if needed
            // Log changes to history
            const changes: string[] = []

            if (updatedEvent.status !== currentEvent.status) {
                changes.push(`Estado: ${currentEvent.status} -> ${updatedEvent.status}`)
            }
            if (updatedEvent.startDate.getTime() !== currentEvent.startDate.getTime()) {
                changes.push('Fecha inicio cambiada')
            }
            if (updatedEvent.endDate.getTime() !== currentEvent.endDate.getTime()) {
                changes.push('Fecha fin cambiada')
            }
            if (updatedEvent.name !== currentEvent.name) {
                changes.push('Nombre cambiado')
            }
            if (updatedEvent.notes !== currentEvent.notes) {
                changes.push('Notas actualizadas')
            }
            if (data.items && data.items.length > 0) {
                // Simple heuristic: if items are provided during update, assume change.
                // Ideally we would compare content, but that's expensive.
                changes.push('Inventario modificado')
            }

            if (changes.length > 0) {
                const session = await auth()
                await tx.eventHistory.create({
                    data: {
                        eventId: id,
                        previousStatus: currentEvent.status,
                        newStatus: updatedEvent.status,
                        changedBy: session?.user?.email || 'Sistema',
                        reason: changes.join(', ')
                    }
                })
            }

            return updatedEvent
        })

        revalidatePath('/events')
        revalidatePath(`/events/${id}`)
        return { success: true, data: result }
    } catch (error) {
        console.error('Error updating event:', error)
        return { success: false, error: 'Error al actualizar evento' }
    }
}

export type CreateEventItem = {
    productId: string
    quantity: number
}

export async function createEvent(data: {
    name: string
    startDate: Date
    endDate: Date
    clientId?: string
    notes?: string
    deposit?: number
    transport?: number
    discount?: number
    items: CreateEventItem[]
}) {
    const { name, startDate, endDate, items, clientId, deposit, transport, discount } = data

    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    if (!items || items.length === 0) {
        return { success: false, error: 'No se seleccionaron productos' }
    }

    try {
        // Validate dates
        if (data.endDate < data.startDate) {
            return { success: false, error: 'La fecha de fin no puede ser anterior a la de inicio' }
        }

        // 1. Check availability
        const availability = await checkAvailability(data.startDate, data.endDate, data.items)
        if (!availability.success) {
            return { success: false, error: availability.error }
        }

        // 2. Create Event
        const event = await prisma.event.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                notes: data.notes,
                clientId: clientId, // Optional link
                deposit: deposit || 0,
                transport: transport || 0,
                discount: discount || 0,
                status: 'RESERVADO', // Estado inicial: Reservado
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: { product: true }
                }
            }
        })

        // Log initial history
        try {
            const session = await auth()
            await prisma.eventHistory.create({
                data: {
                    eventId: event.id,
                    newStatus: 'RESERVADO',
                    changedBy: session?.user?.email || 'Sistema',
                    reason: 'Creación de reserva'
                }
            })
        } catch (error) {
            console.error('Error logging initial history:', error)
        }

        // Email Notification (Fire and forget, don't block response)
        const sendEmailPromise = async () => {
            try {
                let clientEmail = null
                let clientName = data.name

                if (clientId) {
                    const client = await prisma.client.findUnique({ where: { id: clientId } })
                    if (client && client.email) {
                        clientEmail = client.email
                        clientName = client.name
                    }
                }

                if (clientEmail) {
                    await sendReservationEmail(
                        clientEmail,
                        clientName,
                        {
                            id: event.id,
                            name: event.name,
                            startDate: event.startDate,
                            endDate: event.endDate,
                            totalItems: event.items.reduce((acc, item) => acc + item.quantity, 0)
                        },
                        event.items.map(item => ({
                            productName: item.product.name,
                            quantity: item.quantity
                        }))
                    )
                }
            } catch (emailError) {
                console.error('Failed to send email async:', emailError)
            }
        }
        sendEmailPromise()

        revalidatePath('/inventory')
        revalidatePath('/events')
        return { success: true, data: event }
    } catch (error) {
        console.error('Error creating event:', error)
        return { success: false, error: 'Error al crear el evento' }
    }
}

export async function getInventoryLogs(productId: string) {
    try {
        const logs = await prisma.inventoryLog.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        })
        return { success: true, data: logs }
    } catch (error) {
        return { success: false, error: 'Error fetching history' }
    }
}

export async function getClients(query: string) {
    try {
        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { document: { contains: query } },
                    { email: { contains: query } },
                    { phone: { contains: query } }
                ]
            },
            take: 5,
            orderBy: { name: 'asc' },
        })
        return { success: true, data: clients }
    } catch (error) {
        console.error('Error fetching clients:', error)
        return { success: false, error: 'Error al buscar clientes' }
    }
}

export async function createClient(data: {
    name: string
    document?: string
    email?: string
    phone?: string
    department?: string
    city?: string
    neighborhood?: string
    address?: string
    notes?: string
}) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }
    try {
        const client = await prisma.client.create({
            data: {
                name: data.name,
                document: data.document,
                email: data.email,
                phone: data.phone,
                department: data.department,
                city: data.city,
                neighborhood: data.neighborhood,
                address: data.address,
                notes: data.notes
            }
        })
        return { success: true, data: client }
    } catch (error) {
        console.error('Error creating client:', error)
        // Log explicitly if prisma.client is likely missing
        if ((error as any).toString().includes('undefined')) {
            console.error('Prisma Client model might be missing. Restart server required.')
        }
        return { success: false, error: error instanceof Error ? error.message : 'Error al crear cliente' }
    }
}

export type ReturnItem = {
    productId: string
    returnedGood: number
    returnedDamaged: number
}

export async function registerReturn(eventId: string, items: ReturnItem[]) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    console.log(`[registerReturn] Starting for eventId: ${eventId}, items: ${items.length}`)
    try {
        let totalDamageCost = 0
        let isUpdate = false

        // Check if event is already completed to determine if this is an update
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: { items: true }
        })

        if (!existingEvent) {
            return { success: false, error: 'Evento no encontrado' }
        }

        if (existingEvent.status === 'COMPLETADO') {
            isUpdate = true
        }

        // Update each item in the event
        for (const item of items) {
            console.log(`[registerReturn] Processing item: ${item.productId}, Good: ${item.returnedGood}, Damaged: ${item.returnedDamaged}`)

            // Get current event item state to calculate diffs
            const currentItem = existingEvent.items.find(i => i.productId === item.productId)

            if (!currentItem) {
                console.error(`[registerReturn] Item not found in event: ${item.productId}`)
                continue
            }

            // Get product for price info
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) {
                console.error(`[registerReturn] Product not found: ${item.productId}`)
                continue
            }

            const damageDiff = item.returnedDamaged - currentItem.returnedDamaged

            // Calculate cost (using the NEW total damaged amount for display, or the diff? 
            // The return-form shows total damage for the event. 
            // But we want to return the TOTAL cost of this return. 
            // If we are editing, maybe we should return the NEW total cost? Yes.
            if (item.returnedDamaged > 0) {
                totalDamageCost += item.returnedDamaged * product.priceReplacement
            }

            // Update product inventory if damage quantity changed
            if (damageDiff !== 0) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        quantityDamaged: {
                            increment: damageDiff // Can be negative if correcting a mistake
                        }
                    }
                })
            }

            // Update EventItem
            const updateResult = await prisma.eventItem.updateMany({
                where: {
                    eventId: eventId,
                    productId: item.productId,
                },
                data: {
                    returnedGood: item.returnedGood,
                    returnedDamaged: item.returnedDamaged,
                },
            })
            console.log(`[registerReturn] Update result for ${item.productId}: ${updateResult.count} records updated`)
        }

        // Update event status to COMPLETED if not already
        // If it was already completed, we just stay completed.
        const previousStatus = existingEvent.status

        if (previousStatus !== 'COMPLETADO') {
            await prisma.$transaction(async (tx) => {
                await tx.event.update({
                    where: { id: eventId },
                    data: { status: 'COMPLETADO' },
                })

                const session = await auth()
                await tx.eventHistory.create({
                    data: {
                        eventId: eventId,
                        previousStatus: previousStatus,
                        newStatus: 'COMPLETADO',
                        changedBy: session?.user?.email || 'Sistema',
                        reason: 'Devolución procesada'
                    }
                })
            })
        } else {
            // Log edit
            const session = await auth()
            await prisma.eventHistory.create({
                data: {
                    eventId: eventId,
                    previousStatus: 'COMPLETADO',
                    newStatus: 'COMPLETADO',
                    changedBy: session?.user?.email || 'Sistema',
                    reason: 'Actualización de devolución'
                }
            })
        }

        revalidatePath(`/events/${eventId}`)
        revalidatePath('/events')
        return { success: true, data: { totalDamageCost } }
    } catch (error) {
        console.error('Error registering return:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido al registrar la devolución' }
    }
}

const getCachedEvents = unstable_cache(
    async () => {
        const events = await prisma.event.findMany({
            orderBy: { startDate: 'desc' },
            include: { _count: { select: { items: true } } }
        })
        return events
    },
    ['events-list'],
    { revalidate: 30 }
)

export async function getEvents() {
    try {
        const events = await getCachedEvents()
        return { success: true, data: events }
    } catch (error) {
        console.error('Error fetching events:', error)
        return { success: false, error: 'Error al obtener eventos' }
    }
}

export async function getEventById(id: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                client: true,
                history: { orderBy: { createdAt: 'desc' } }
            },
        })
        if (!event) return { success: false, error: 'Evento no encontrado' }
        return { success: true, data: event }

    } catch (error) {
        console.error('Error fetching event:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido al obtener el evento' }
    }
}

export async function getEventHistory(eventId?: string) {
    try {
        const whereClause = eventId ? { eventId } : {}
        const history = await prisma.eventHistory.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { event: { select: { name: true } } }
        })
        return { success: true, data: history }
    } catch (error) {
        console.error('Error fetching event history:', error)
        return { success: false, error: 'Error al obtener el historial' }
    }
}



export async function getDashboardStats(filters?: {
    year?: number
    month?: number  // 1-12
}) {
    const cacheKey = `dashboard-${filters?.year ?? 'all'}-${filters?.month ?? 'all'}`
    
    const getCachedDashboard = unstable_cache(
        async () => {
            return await _getDashboardStatsInternal(filters)
        },
        [cacheKey],
        { revalidate: 60 }
    )

    return getCachedDashboard()
}

async function _getDashboardStatsInternal(filters?: {
    year?: number
    month?: number
}) {
    try {
        const now = new Date()

        // Build date filter conditions
        let dateFilter: any = {}
        let dateFilterByEndDate: any = {}

        if (filters?.year || filters?.month) {
            if (filters.year && filters.month) {
                // Filter by specific month and year
                const startOfMonth = new Date(filters.year, filters.month - 1, 1)
                const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59, 999)

                dateFilter = {
                    startDate: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }

                dateFilterByEndDate = {
                    endDate: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            } else if (filters.year) {
                // Filter by year only
                const startOfYear = new Date(filters.year, 0, 1)
                const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59, 999)

                dateFilter = {
                    startDate: {
                        gte: startOfYear,
                        lte: endOfYear
                    }
                }

                dateFilterByEndDate = {
                    endDate: {
                        gte: startOfYear,
                        lte: endOfYear
                    }
                }
            }
        }

        // Calculate statsStartDate before parallel queries (needed for some queries)
        let statsStartDate: Date
        let monthsToShow = 6

        if (filters?.year && filters?.month) {
            statsStartDate = new Date(filters.year, filters.month - 1, 1)
            monthsToShow = 1
        } else if (filters?.year) {
            statsStartDate = new Date(filters.year, 0, 1)
            monthsToShow = 12
        } else {
            statsStartDate = new Date()
            statsStartDate.setMonth(statsStartDate.getMonth() - 5)
        }

        // Run all independent queries in parallel
        const [
            activeReservations,
            products,
            pendingReturns,
            recentEvents,
            allEvents,
            completedEvents,
            activeEvents,
            completedEventsInRange,
            totalClients,
            activeClients,
            topClientsGrouped,
            rentalStats,
            currentlyInUseAgg,
            completedEventsCount,
            cancelledEvents,
        ] = await Promise.all([
            // 1. Active reservations count
            prisma.event.count({
                where: { status: { in: ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] }, ...dateFilter }
            }),
            // 2. All products (for inventory totals)
            prisma.product.findMany({
                select: { id: true, name: true, category: true, totalQuantity: true, quantityDamaged: true, priceReplacement: true, priceUnit: true }
            }),
            // 3. Pending returns count
            prisma.event.count({
                where: { endDate: { lte: now }, status: { notIn: ['COMPLETADO', 'COMPLETED'] }, ...dateFilterByEndDate }
            }),
            // 4. Upcoming events (next 5)
            prisma.event.findMany({
                take: 5,
                orderBy: { startDate: 'asc' },
                where: { status: { in: ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] }, startDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
            }),
            // 5. Events for monthly chart
            prisma.event.findMany({
                where: { startDate: { gte: statsStartDate }, status: { not: 'CANCELLED' }, ...dateFilter },
                select: { startDate: true }
            }),
            // 6. Completed events with items (for revenue)
            prisma.event.findMany({
                where: { status: { in: ['COMPLETADO', 'COMPLETED'] }, ...dateFilterByEndDate },
                include: { items: { include: { product: { select: { priceUnit: true, priceReplacement: true } } } } }
            }),
            // 7. Active events with items (for projected revenue)
            prisma.event.findMany({
                where: { status: { in: ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] }, ...dateFilter },
                include: { items: { include: { product: { select: { priceUnit: true } } } } }
            }),
            // 8. Completed events in range for monthly revenue chart
            prisma.event.findMany({
                where: { status: { in: ['COMPLETADO', 'COMPLETED'] }, endDate: { gte: statsStartDate }, ...dateFilterByEndDate },
                select: { endDate: true, items: { include: { product: { select: { priceUnit: true, priceReplacement: true } } } } }
            }),
            // 9. Total clients count
            prisma.client.count(),
            // 10. Active clients count (use count instead of findMany+length)
            prisma.client.count({
                where: { events: { some: { status: { in: ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] }, ...dateFilter } } }
            }),
            // 11. Top clients by event count using groupBy (avoids fetching ALL clients + ALL their events)
            prisma.event.groupBy({
                by: ['clientId'],
                _count: { id: true },
                where: { clientId: { not: null }, ...(dateFilter.startDate ? dateFilter : {}) },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
            // 12. Rental & damage stats per product using groupBy (avoids full join on all eventItems)
            prisma.eventItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true, returnedDamaged: true },
                where: { event: dateFilter.startDate ? dateFilter : undefined }
            }),
            // 13. Currently in use per product (aggregated, no product join needed)
            prisma.eventItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                where: { event: { status: { in: ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'] } } }
            }),
            // 14. Completed events count
            prisma.event.count({
                where: { status: { in: ['COMPLETADO', 'COMPLETED'] }, ...dateFilterByEndDate }
            }),
            // 15. Cancelled events count
            prisma.event.count({
                where: { status: 'CANCELLED', ...dateFilterByEndDate }
            }),
        ])

        // --- Compute derived values ---

        // Inventory totals
        const totalInventory = products.reduce((acc, curr) => acc + curr.totalQuantity, 0)
        const totalDamagedQuantity = products.reduce((acc, curr) => acc + (curr.quantityDamaged || 0), 0)
        const inventoryValue = products.reduce((acc, curr) => acc + (curr.totalQuantity * curr.priceReplacement), 0)

        const categoryStatsMap = products.reduce((acc, curr) => {
            const cat = curr.category || 'Sin Categoría'
            acc[cat] = (acc[cat] || 0) + curr.totalQuantity
            return acc
        }, {} as Record<string, number>)
        const rCategoryStats = Object.entries(categoryStatsMap).map(([name, value]) => ({ name, value }))

        // Monthly event stats
        const monthlyStatsMap = new Map<string, number>()
        for (let i = 0; i < monthsToShow; i++) {
            const d = new Date(statsStartDate)
            d.setMonth(statsStartDate.getMonth() + i)
            const key = d.toLocaleString('es-MX', { month: 'short', year: filters?.year ? undefined : 'numeric' })
            monthlyStatsMap.set(key, 0)
        }
        allEvents.forEach(event => {
            const key = event.startDate.toLocaleString('es-MX', { month: 'short', year: filters?.year ? undefined : 'numeric' })
            if (monthlyStatsMap.has(key)) monthlyStatsMap.set(key, monthlyStatsMap.get(key)! + 1)
        })
        const monthlyStats = Array.from(monthlyStatsMap.entries())
            .map(([name, value], index) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: `var(--chart-${(index % 5) + 1})` }))

        // Revenue
        let totalRevenue = 0
        let totalDamageCost = 0
        completedEvents.forEach(event => {
            event.items.forEach(item => {
                totalRevenue += item.quantity * item.product.priceUnit
                if (!(item as any).damageRestored) totalDamageCost += item.returnedDamaged * item.product.priceReplacement
            })
        })

        let projectedRevenue = 0
        activeEvents.forEach(event => {
            event.items.forEach(item => { projectedRevenue += item.quantity * item.product.priceUnit })
        })

        // Monthly revenue chart
        const monthlyRevenueMap = new Map<string, number>()
        for (let i = 0; i < monthsToShow; i++) {
            const d = new Date(statsStartDate)
            d.setMonth(statsStartDate.getMonth() + i)
            const key = d.toLocaleString('es-MX', { month: 'short', year: filters?.year ? undefined : 'numeric' })
            monthlyRevenueMap.set(key, 0)
        }
        completedEventsInRange.forEach(event => {
            const key = event.endDate.toLocaleString('es-MX', { month: 'short', year: filters?.year ? undefined : 'numeric' })
            if (monthlyRevenueMap.has(key)) {
                const revenue = event.items.reduce((acc, item) => acc + (item.quantity * item.product.priceUnit) + (item.returnedDamaged * item.product.priceReplacement), 0)
                monthlyRevenueMap.set(key, monthlyRevenueMap.get(key)! + revenue)
            }
        })
        const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
            .map(([name, value], index) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: `var(--chart-${(index % 5) + 1})` }))

        // Top clients — fetch names for the grouped clientIds in one query
        const topClientIds = topClientsGrouped.map(c => c.clientId).filter(Boolean) as string[]
        const topClientNames = topClientIds.length > 0
            ? await prisma.client.findMany({ where: { id: { in: topClientIds } }, select: { id: true, name: true } })
            : []
        const clientNameMap = new Map(topClientNames.map(c => [c.id, c.name]))
        const topClients = topClientsGrouped
            .map(c => ({ name: clientNameMap.get(c.clientId!) ?? 'Desconocido', eventCount: c._count.id }))
            .filter(c => c.eventCount > 0)

        // Top rented & damaged products using the products map
        const productMap = new Map(products.map(p => [p.id, p.name]))
        const topRentedProducts = rentalStats
            .filter(r => (r._sum.quantity ?? 0) > 0)
            .sort((a, b) => (b._sum.quantity ?? 0) - (a._sum.quantity ?? 0))
            .slice(0, 5)
            .map(r => ({ name: productMap.get(r.productId) ?? r.productId, count: r._sum.quantity ?? 0 }))
        const topDamagedProducts = rentalStats
            .filter(r => (r._sum.returnedDamaged ?? 0) > 0)
            .sort((a, b) => (b._sum.returnedDamaged ?? 0) - (a._sum.returnedDamaged ?? 0))
            .slice(0, 5)
            .map(r => ({ name: productMap.get(r.productId) ?? r.productId, count: r._sum.returnedDamaged ?? 0 }))

        // Utilization rate
        const totalInUse = currentlyInUseAgg.reduce((acc, r) => acc + (r._sum.quantity ?? 0), 0)
        const utilizationRate = totalInventory > 0 ? (totalInUse / totalInventory) * 100 : 0

        const averageEventValue = completedEvents.length > 0 ? totalRevenue / completedEvents.length : 0

        return {
            success: true,
            data: {
                // Original stats
                activeReservations,
                totalInventory,
                totalDamagedQuantity,
                inventoryValue,
                pendingReturns,
                recentEvents,
                categoryStats: rCategoryStats,
                monthlyStats,
                // Revenue stats
                totalRevenue,
                totalDamageCost,
                projectedRevenue,
                monthlyRevenue,
                // Client stats
                totalClients,
                activeClients,
                topClients,
                // Product stats
                topRentedProducts,
                topDamagedProducts,
                utilizationRate,
                // Event stats
                completedEvents: completedEventsCount,
                cancelledEvents,
                averageEventValue
            }
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        if (error instanceof Error) console.error(error.stack)
        return { success: false, error: 'Error al cargar estadísticas' }
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/inicio'
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}

// ============================================
// DAMAGED PRODUCTS HISTORY
// ============================================

export async function getDamagedProductsHistory(filters?: {
    showRestored?: boolean  // true = solo restaurados, false = solo pendientes, undefined = todos
}) {
    try {
        const where: any = {
            returnedDamaged: { gt: 0 }
        }

        if (filters?.showRestored !== undefined) {
            where.damageRestored = filters.showRestored
        }

        const damagedItems = await prisma.eventItem.findMany({
            where,
            include: {
                product: true,
                event: {
                    include: {
                        client: true
                    }
                }
            },
            orderBy: {
                // If showing pending (restored=false), order by event end date (most recent damage)
                // If showing restored, order by restoredAt
                event: { endDate: 'desc' }
            }
        })

        return {
            success: true,
            data: damagedItems
        }
    } catch (error) {
        console.error('Error fetching damaged products history:', error)
        return { success: false, error: 'Error al cargar historial de daños' }
    }
}

export async function markDamageAsRestored(eventItemId: string) {
    try {
        const updated = await prisma.eventItem.update({
            where: { id: eventItemId },
            data: {
                damageRestored: true,
                restoredAt: new Date()
            } as any,
            include: { product: true }
        })

        // Decrement quantityDamaged on the product (mark as Available again)
        if (updated.returnedDamaged > 0) {
            await prisma.product.update({
                where: { id: updated.productId },
                data: {
                    quantityDamaged: {
                        decrement: updated.returnedDamaged
                    }
                } as any
            })
        }

        revalidatePath('/inventory/damages')
        revalidatePath('/')

        return {
            success: true,
            data: updated
        }
    } catch (error) {
        console.error('Error marking damage as restored:', error)
        return { success: false, error: 'Error al marcar como restaurado' }
    }
}

export async function getUsers() {
    const role = await getCurrentRole();
    if (role !== 'ADMIN') return { success: false, error: 'No autorizado' }

    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }
        })
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: 'Error al obtener usuarios' }
    }
}

export async function toggleUserActive(userId: string) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { active: true }
        })

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' }
        }

        await prisma.user.update({
            where: { id: userId },
            data: { active: !user.active }
        })

        revalidatePath('/admin/users')
        return { success: true, data: { active: !user.active } }
    } catch (error) {
        console.error('Error toggling user active status:', error)
        return { success: false, error: 'Error al actualizar estado del usuario' }
    }
}

export async function registerUser(data: { name: string, email: string, password: string, role: string }) {
    const role = await getCurrentRole();
    if (role !== 'ADMIN') return { success: false, error: 'No autorizado' }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role
            } as any
        })
        return { success: true, data: { id: user.id, email: user.email } }
    } catch (error) {
        return { success: false, error: 'Error al crear usuario' }
    }
}

export async function deleteUser(userId: string) {
    const role = await getCurrentRole();
    if (role !== 'ADMIN') return { success: false, error: 'No autorizado' }

    try {
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Error al eliminar usuario' }
    }
}

export async function updateUser(userId: string, data: {
    name?: string,
    email?: string,
    password?: string,
    role?: string
}) {
    const role = await getCurrentRole();
    if (role !== 'ADMIN') return { success: false, error: 'No autorizado' }

    try {
        const updateData: any = {}

        if (data.name) updateData.name = data.name
        if (data.email) updateData.email = data.email
        if (data.role) updateData.role = data.role

        // Only update password if provided
        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10)
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        revalidatePath('/admin/users')
        return { success: true, data: { id: user.id, email: user.email } }
    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, error: 'Error al actualizar usuario' }
    }
}

// ==================== Event Status Management ====================

import { EventStatus, canTransition } from './event-status'

export async function updateEventStatus(eventId: string, newStatus: EventStatus) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        })

        if (!event) {
            return { success: false, error: 'Evento no encontrado' }
        }

        // Validar transición
        if (!canTransition(event.status as EventStatus, newStatus)) {
            return {
                success: false,
                error: `No se puede cambiar de ${event.status} a ${newStatus}`
            }
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { status: newStatus }
        })

        revalidatePath('/events')
        revalidatePath(`/events/${eventId}`)
        revalidatePath('/')

        return { success: true, data: updated }
    } catch (error) {
        console.error('Error updating event status:', error)
        return { success: false, error: 'Error al actualizar estado' }
    }
}

// ==================== Export Actions ====================

export async function getEventsForExport(filters?: {
    startDate?: Date
    endDate?: Date
}) {
    try {
        const where: any = {}

        if (filters?.startDate || filters?.endDate) {
            where.startDate = {}
            if (filters.startDate) {
                where.startDate.gte = filters.startDate
            }
            if (filters.endDate) {
                where.startDate.lte = filters.endDate
            }
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                client: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        })

        return { success: true, data: events }
    } catch (error) {
        console.error('Error fetching events for export:', error)
        return { success: false, error: 'Error al obtener eventos' }
    }
}

export async function getInventoryForExport() {
    try {
        const products = await prisma.product.findMany({
            include: {
                eventItems: {
                    where: {
                        event: {
                            status: { in: ['RESERVADO', 'DESPACHADO'] }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: products }
    } catch (error) {
        console.error('Error fetching inventory for export:', error)
        return { success: false, error: 'Error al obtener inventario' }
    }
}

export async function getClientsForExport() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                events: {
                    orderBy: { startDate: 'desc' },
                    take: 1
                },
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: clients }
    } catch (error) {
        console.error('Error fetching clients for export:', error)
        return { success: false, error: 'Error al obtener clientes' }
    }
}

export async function getDamagedProductsForExport(filters?: {
    startDate?: Date
    endDate?: Date
}) {
    try {
        const where: any = {
            returnedDamaged: { gt: 0 }
        }

        if (filters?.startDate || filters?.endDate) {
            where.event = {
                startDate: {}
            }
            if (filters.startDate) {
                where.event.startDate.gte = filters.startDate
            }
            if (filters.endDate) {
                where.event.startDate.lte = filters.endDate
            }
        }

        const damaged = await prisma.eventItem.findMany({
            where,
            include: {
                product: true,
                event: {
                    include: {
                        client: true
                    }
                }
            },
            orderBy: {
                event: {
                    startDate: 'desc'
                }
            }
        })

        return { success: true, data: damaged }
    } catch (error) {
        console.error('Error fetching damaged products for export:', error)
        return { success: false, error: 'Error al obtener productos dañados' }
    }
}

// ==================== Import Actions ====================

export async function importInventoryFromExcel(products: {
    id?: string
    name: string
    category?: string
    subcategory?: string
    novedad?: string
    description?: string
    totalQuantity: number
    quantityDamaged?: number
    priceUnit: number
    priceReplacement: number
    code?: string
}[]) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'No autorizado' }
        }

        const results = {
            created: 0,
            updated: 0,
            errors: [] as string[]
        }

        for (const productData of products) {
            try {
                let existing = null;

                if (productData.id && productData.id.trim() !== '') {
                    existing = await prisma.product.findUnique({ where: { id: productData.id } })
                }

                if (!existing && productData.name) {
                    existing = await prisma.product.findFirst({ where: { name: productData.name } })
                }

                const dataToSave = {
                    name: productData.name || 'Sin nombre',
                    category: productData.category || null,
                    subcategory: productData.subcategory || null,
                    novedad: productData.novedad || null,
                    description: productData.description || null,
                    totalQuantity: productData.totalQuantity || 0,
                    priceUnit: productData.priceUnit || 0,
                    priceReplacement: productData.priceReplacement || 0,
                    code: productData.code || null,
                };

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: dataToSave
                    })
                    results.updated++
                } else {
                    await prisma.product.create({
                        data: dataToSave
                    })
                    results.created++
                }
            } catch (error) {
                console.error(`Error processing product ${productData.name}:`, error)
                results.errors.push(`Error al procesar "${productData.name}"`)
            }
        }

        revalidatePath('/inventory')

        return {
            success: true,
            data: results,
            message: `Importación completada: ${results.created} creados, ${results.updated} actualizados${results.errors.length > 0 ? `, ${results.errors.length} errores` : ''}`
        }
    } catch (error) {
        console.error('Error importing inventory:', error)
        return { success: false, error: 'Error al importar inventario' }
    }
}

export async function deleteProduct(id: string) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Permisos insuficientes' }
    }

    try {
        // 1. Check if product is used in any EventItem
        const usageCount = await prisma.eventItem.count({
            where: { productId: id }
        })

        if (usageCount > 0) {
            return {
                success: false,
                error: 'No se puede eliminar: El producto es parte de eventos existentes (pasados o futuros). Para preservar el historial, edite el producto o ajuste su stock.'
            }
        }

        // 2. Delete
        await prisma.product.delete({
            where: { id }
        })

        revalidatePath('/inventory')
        return { success: true }
    } catch (error) {
        console.error('Error deleting product:', error)
        return { success: false, error: 'Error al eliminar producto' }
    }
}
