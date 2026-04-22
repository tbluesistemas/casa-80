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
        // Obtenemos los textos del hero (tipo = 'hero')
        const heroText = await prisma.webContentSection.findFirst({
            where: {
                tipo: 'hero',
                activo: true,
            },
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
        })

        // Obtenemos las imágenes activas del carrusel
        const heroImages = await prisma.heroCarouselImage.findMany({
            where: {
                activo: true,
            },
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
        })

        return NextResponse.json(
            { 
                success: true, 
                data: {
                    text: heroText || null,
                    images: heroImages
                } 
            },
            { status: 200, headers: corsHeaders }
        )
    } catch (error) {
        console.error('Error fetching public hero content:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
