import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const { id } = await params
        const body = await req.json()

        if (!body.imageUrl) {
            return NextResponse.json({ message: 'La URL de la imagen es obligatoria' }, { status: 400 })
        }

        const updated = await prisma.heroCarouselImage.update({
            where: { id },
            data: {
                imageUrl: body.imageUrl.trim(),
                alt: body.alt?.trim() || '',
                orden: Number(body.orden) || 0,
                activo: body.activo ?? true,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating hero carousel image:', error)
        return NextResponse.json({ message: 'No se pudo actualizar la imagen' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const { id } = await params
        await prisma.heroCarouselImage.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting hero carousel image:', error)
        return NextResponse.json({ message: 'No se pudo eliminar la imagen' }, { status: 500 })
    }
}
