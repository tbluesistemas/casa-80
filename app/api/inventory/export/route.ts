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
            orderBy: { name: 'asc' },
        })

        const data = products.map(p => ({
            'ID Interno': p.id,
            'Código': p.code || '',
            'Nombre': p.name,
            'Categoría': p.category || '',
            'Subcategoría': p.subcategory || '',
            'Novedad': p.novedad || '',
            'Descripción': p.description || '',
            'Cantidad Total': p.totalQuantity,
            'Cantidad Dañada': p.quantityDamaged,
            'Valor Unitario': p.priceUnit,
            'Valor Reposición': p.priceReplacement,
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
