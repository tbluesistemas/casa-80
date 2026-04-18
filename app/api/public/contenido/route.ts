import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const tipo = searchParams.get('tipo')

        const secciones = await prisma.webContentSection.findMany({
            where: {
                activo: true,
                ...(tipo ? { tipo } : {}),
            },
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                tipo: true,
                titulo: true,
                subtitulo: true,
                descripcion: true,
                imageUrl: true,
                orden: true,
                activo: true,
            },
        })

        return NextResponse.json(
            { success: true, count: secciones.length, data: secciones },
            { status: 200, headers: corsHeaders }
        )
    } catch (error) {
        console.error('Error fetching public content:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
