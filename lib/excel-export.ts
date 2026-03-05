import * as XLSX from 'xlsx'
import { formatDateForExcel, formatCurrencyForExcel, getCurrentDateForFilename } from './export-utils'

export function exportEventsToExcel(events: any[]) {
    const data = events.flatMap(event =>
        event.items.map((item: any) => ({
            'Evento': event.name,
            'Cliente': event.client?.name || 'Sin cliente',
            'Fecha Inicio': formatDateForExcel(event.startDate),
            'Fecha Fin': formatDateForExcel(event.endDate),
            'Estado': event.status,
            'Producto': item.product.name,
            'Cantidad': item.quantity,
            'Devuelto (Bien)': item.returnedGood,
            'Dañado': item.returnedDamaged,
            'Precio Unitario': formatCurrencyForExcel(item.product.priceUnit),
            'Valor Total': formatCurrencyForExcel(item.quantity * item.product.priceUnit)
        }))
    )

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Eventos')

    // Auto-ajustar ancho de columnas
    const colWidths = [
        { wch: 30 }, // Evento
        { wch: 25 }, // Cliente
        { wch: 20 }, // Fecha Inicio
        { wch: 20 }, // Fecha Fin
        { wch: 15 }, // Estado
        { wch: 30 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Devuelto
        { wch: 10 }, // Dañado
        { wch: 15 }, // Precio
        { wch: 15 }, // Valor Total
    ]
    ws['!cols'] = colWidths

    const filename = `eventos_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportInventoryToExcel(products: any[]) {
    const data = products.map(product => {
        const inUse = product.eventItems?.reduce((sum: number, item: any) =>
            sum + item.quantity, 0
        ) || 0

        return {
            'ID Interno': product.id,
            'Código': product.code || '',
            'Producto': product.name,
            'Categoría': product.category || 'Sin categoría',
            'Cantidad Total': product.totalQuantity,
            'En Uso': inUse,
            'Disponible': product.totalQuantity - inUse,
            'Precio Unitario': formatCurrencyForExcel(product.priceUnit),
            'Precio Reemplazo': formatCurrencyForExcel(product.priceReplacement),
            'Valor Total': formatCurrencyForExcel(product.totalQuantity * product.priceReplacement)
        }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

    const colWidths = [
        { wch: 35 }, // ID Interno
        { wch: 15 }, // Código
        { wch: 30 }, // Producto
        { wch: 20 }, // Categoría
        { wch: 15 }, // Cantidad Total
        { wch: 10 }, // En Uso
        { wch: 12 }, // Disponible
        { wch: 18 }, // Precio Unitario
        { wch: 18 }, // Precio Reemplazo
        { wch: 18 }, // Valor Total
    ]
    ws['!cols'] = colWidths

    const filename = `inventario_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportClientsToExcel(clients: any[]) {
    const data = clients.map(client => ({
        'Nombre': client.name,
        'Documento': client.document || '',
        'Email': client.email || '',
        'Teléfono': client.phone || '',
        'Departamento': client.department || '',
        'Ciudad': client.city || '',
        'Barrio': client.neighborhood || '',
        'Dirección': client.address || '',
        'Notas': client.notes || '',
        'Número de Eventos': client._count?.events || 0,
        'Última Reserva': client.events?.[0]
            ? formatDateForExcel(client.events[0].startDate)
            : 'Sin eventos'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

    const colWidths = [
        { wch: 25 }, // Nombre
        { wch: 15 }, // Documento
        { wch: 30 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Departamento
        { wch: 15 }, // Ciudad
        { wch: 20 }, // Barrio
        { wch: 30 }, // Dirección
        { wch: 30 }, // Notas
        { wch: 18 }, // Número de Eventos
        { wch: 20 }, // Última Reserva
    ]
    ws['!cols'] = colWidths

    const filename = `clientes_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export function exportDamagedProductsToExcel(items: any[]) {
    const data = items.map(item => ({
        'Fecha Evento': formatDateForExcel(item.event.startDate),
        'Cliente': item.event.client?.name || 'Sin cliente',
        'Evento': item.event.name,
        'Producto': item.product.name,
        'Cantidad Dañada': item.returnedDamaged,
        'Costo Reemplazo': formatCurrencyForExcel(item.returnedDamaged * item.product.priceReplacement),
        'Estado': item.damageRestored ? 'Restaurado' : 'Pendiente',
        'Fecha Restauración': item.restoredAt
            ? formatDateForExcel(item.restoredAt)
            : 'N/A'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos Dañados')

    const colWidths = [
        { wch: 20 }, // Fecha Evento
        { wch: 25 }, // Cliente
        { wch: 30 }, // Evento
        { wch: 30 }, // Producto
        { wch: 15 }, // Cantidad Dañada
        { wch: 18 }, // Costo Reemplazo
        { wch: 12 }, // Estado
        { wch: 20 }, // Fecha Restauración
    ]
    ws['!cols'] = colWidths

    const filename = `danos_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}
