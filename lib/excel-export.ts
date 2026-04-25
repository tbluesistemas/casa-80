import * as XLSX from 'xlsx'
import { formatDateForExcel, formatCurrencyForExcel, getCurrentDateForFilename } from './export-utils'

type ExportEvent = {
    name: string
    startDate: Date | string
    endDate: Date | string
    status: string
    client?: {
        name?: string | null
    } | null
    items: Array<{
        quantity: number
        returnedGood: number
        returnedDamaged: number
        product: {
            name: string
            priceUnit: number
        }
    }>
}

type ExportInventoryProduct = {
    inventoryNumber?: number | null
    active?: boolean | null
    code?: string | null
    name: string
    category?: string | null
    totalQuantity: number
    priceUnit?: number | null
    priceReplacement: number
    eventItems?: Array<{
        quantity: number
    }>
}

type ExportClient = {
    name: string
    document?: string | null
    email?: string | null
    phone?: string | null
    department?: string | null
    city?: string | null
    neighborhood?: string | null
    address?: string | null
    notes?: string | null
    _count?: {
        events?: number
    }
    events?: Array<{
        startDate: Date | string
    }>
}

type ExportDamagedItem = {
    returnedDamaged: number
    damageRestored: boolean
    restoredAt?: Date | string | null
    event: {
        startDate: Date | string
        name: string
        client?: {
            name?: string | null
        } | null
    }
    product: {
        name: string
        priceReplacement: number
    }
}

function toDate(value: Date | string) {
    return value instanceof Date ? value : new Date(value)
}

export function exportEventsToExcel(events: unknown[]) {
    const typedEvents = events as ExportEvent[]

    const data = typedEvents.flatMap(event =>
        event.items.map(item => ({
            'Evento': event.name,
            'Cliente': event.client?.name || 'Sin cliente',
            'Fecha Inicio': formatDateForExcel(toDate(event.startDate)),
            'Fecha Fin': formatDateForExcel(toDate(event.endDate)),
            'Estado': event.status,
            'Producto': item.product.name,
            'Cantidad': item.quantity,
            'Devuelto (Bien)': item.returnedGood,
            'Danado': item.returnedDamaged,
            'Precio Unitario': formatCurrencyForExcel(item.product.priceUnit ?? 0),
            'Valor Total': formatCurrencyForExcel(item.quantity * (item.product.priceUnit ?? 0)),
        }))
    )

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Eventos')

    ws['!cols'] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
    ]

    const filename = `eventos_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportInventoryToExcel(products: unknown[]) {
    const typedProducts = products as ExportInventoryProduct[]

    const data = typedProducts.map(product => {
        const inUse = product.eventItems?.reduce((sum, item) => sum + item.quantity, 0) || 0

        return {
            'ID Inventario': product.inventoryNumber ?? '',
            'Activo': product.active === false ? 'NO' : 'SI',
            'Codigo / SKU': product.code || '',
            'Producto': product.name,
            'Categoria': product.category || 'Sin categoria',
            'Cantidad Total': product.totalQuantity,
            'En Uso': inUse,
            'Disponible': product.active === false ? 0 : (product.totalQuantity - inUse),
            'Precio Unitario': formatCurrencyForExcel(product.priceUnit ?? 0),
            'Precio de Daño': formatCurrencyForExcel(product.priceReplacement),
            'Valor Total': formatCurrencyForExcel(product.totalQuantity * product.priceReplacement),
        }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

    ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
    ]

    const filename = `inventario_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportClientsToExcel(clients: unknown[]) {
    const typedClients = clients as ExportClient[]

    const data = typedClients.map(client => ({
        'Nombre': client.name,
        'Documento': client.document || '',
        'Email': client.email || '',
        'Telefono': client.phone || '',
        'Departamento': client.department || '',
        'Ciudad': client.city || '',
        'Barrio': client.neighborhood || '',
        'Direccion': client.address || '',
        'Notas': client.notes || '',
        'Numero de Eventos': client._count?.events || 0,
        'Ultima Reserva': client.events?.[0]
            ? formatDateForExcel(toDate(client.events[0].startDate))
            : 'Sin eventos',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

    ws['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 30 },
        { wch: 18 },
        { wch: 20 },
    ]

    const filename = `clientes_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportDamagedProductsToExcel(items: unknown[]) {
    const typedItems = items as ExportDamagedItem[]

    const data = typedItems.map(item => ({
        'Fecha Evento': formatDateForExcel(toDate(item.event.startDate)),
        'Cliente': item.event.client?.name || 'Sin cliente',
        'Evento': item.event.name,
        'Producto': item.product.name,
        'Cantidad Danada': item.returnedDamaged,
        'Costo Reemplazo': formatCurrencyForExcel(item.returnedDamaged * item.product.priceReplacement),
        'Estado': item.damageRestored ? 'Restaurado' : 'Pendiente',
        'Fecha Restauracion': item.restoredAt
            ? formatDateForExcel(toDate(item.restoredAt))
            : 'N/A',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos Danados')

    ws['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 30 },
        { wch: 30 },
        { wch: 15 },
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
    ]

    const filename = `danos_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}
