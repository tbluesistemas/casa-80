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

export async function GET() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const secciones = await prisma.webContentSection.findMany({
        orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(secciones)
}

export async function POST(req: NextRequest) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const body = normalizePayload(await req.json())

        if (!body.titulo) {
            return NextResponse.json({ message: 'El título es obligatorio' }, { status: 400 })
        }

        const created = await prisma.webContentSection.create({
            data: body,
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        console.error('Error creating content section:', error)
        return NextResponse.json({ message: 'No se pudo crear la sección' }, { status: 500 })
    }
}
