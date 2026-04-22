import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const images = await prisma.heroCarouselImage.findMany({
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
        })
        return NextResponse.json(images)
    } catch (error) {
        console.error('Error fetching hero carousel images:', error)
        return NextResponse.json({ message: 'No se pudieron obtener las imágenes' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const body = await req.json()
        
        if (!body.imageUrl) {
            return NextResponse.json({ message: 'La URL de la imagen es obligatoria' }, { status: 400 })
        }

        const created = await prisma.heroCarouselImage.create({
            data: {
                imageUrl: body.imageUrl.trim(),
                alt: body.alt?.trim() || '',
                orden: Number(body.orden) || 0,
                activo: body.activo ?? true,
            },
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        console.error('Error creating hero carousel image:', error)
        return NextResponse.json({ message: 'No se pudo crear la imagen' }, { status: 500 })
    }
}
