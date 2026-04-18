import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
    try {
        const bancos = await prisma.paymentMethod.findMany({
            where: { activo: true },
            orderBy: [{ nombre: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                nombre: true,
                color: true,
                titular: true,
                numeroCuenta: true,
                cci: true,
                qrImageUrl: true,
            },
        })

        return NextResponse.json(
            { success: true, count: bancos.length, data: bancos },
            { status: 200, headers: corsHeaders }
        )
    } catch (error) {
        console.error('Error fetching public payment methods:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
