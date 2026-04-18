import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ContentPayload = {
    tipo?: string
    titulo?: string
    subtitulo?: string
    descripcion?: string
    imageUrl?: string
    orden?: number
    activo?: boolean
}

function normalizePayload(body: ContentPayload) {
    const normalizedOrder = Number(body.orden)

    return {
        tipo: body.tipo?.trim() || 'general',
        titulo: body.titulo?.trim() || '',
        subtitulo: body.subtitulo?.trim() || '',
        descripcion: body.descripcion?.trim() || '',
        imageUrl: body.imageUrl?.trim() || '',
        orden: Number.isFinite(normalizedOrder) ? normalizedOrder : 0,
        activo: body.activo ?? true,
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const { id } = await params
        const body = normalizePayload(await req.json())

        if (!body.titulo) {
            return NextResponse.json({ message: 'El título es obligatorio' }, { status: 400 })
        }

        const updated = await prisma.webContentSection.update({
            where: { id },
            data: body,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating content section:', error)
        return NextResponse.json({ message: 'No se pudo actualizar la sección' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const { id } = await params
        await prisma.webContentSection.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting content section:', error)
        return NextResponse.json({ message: 'No se pudo eliminar la sección' }, { status: 500 })
    }
}
