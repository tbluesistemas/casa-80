import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import * as xlsx from 'xlsx'

export async function GET() {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const products = await prisma.product.findMany({
            orderBy: { inventoryNumber: 'asc' },
        })

        const data = products.map(product => ({
            'ID Inventario': product.inventoryNumber,
            'Activo': product.active ? 'SI' : 'NO',
            'Codigo / SKU': product.code || '',
            'Nombre': product.name,
            'Categoria': product.category || '',
            'Subcategoria': product.subcategory || '',
            'Novedad': product.novedad || '',
            'Descripcion': product.description || '',
            'Cantidad Total': product.totalQuantity,
            'Cantidad Danada': product.quantityDamaged,
            'Valor Unitario': product.priceUnit,
            'Valor Reposicion': product.priceReplacement,
        }))

        const ws = xlsx.utils.json_to_sheet(data)
        const wb = xlsx.utils.book_new()
        xlsx.utils.book_append_sheet(wb, ws, 'Inventario')

        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="inventario.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        })
    } catch (error) {
        console.error('Error exporting inventory:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
