import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const API_KEY = process.env.BACKEND_API_KEY || 'casa80-api-key-2024'

export async function GET() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const res = await fetch(`${BACKEND_URL}/api/bancos`, {
        headers: { 'x-api-key': API_KEY },
        cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/bancos`, {
        method: 'POST',
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
}
