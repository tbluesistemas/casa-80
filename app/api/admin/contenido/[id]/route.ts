import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const API_KEY = process.env.BACKEND_API_KEY || 'casa80-api-key-2024'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/contenido/${id}`, {
        method: 'PUT',
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const res = await fetch(`${BACKEND_URL}/api/contenido/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
    })

    if (res.status === 204) {
        return new NextResponse(null, { status: 204 })
    }
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
}
