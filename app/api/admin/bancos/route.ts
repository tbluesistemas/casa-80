import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PaymentPayload = {
    id?: string
    nombre?: string
    color?: string
    titular?: string
    numeroCuenta?: string
    cci?: string
    qrImageUrl?: string
    activo?: boolean
}

function normalizePayload(body: PaymentPayload) {
    return {
        id: body.id?.trim().toLowerCase() || '',
        nombre: body.nombre?.trim() || '',
        color: body.color?.trim() || '#000000',
        titular: body.titular?.trim() || '',
        numeroCuenta: body.numeroCuenta?.trim() || '',
        cci: body.cci?.trim() || '',
        qrImageUrl: body.qrImageUrl?.trim() || '',
        activo: body.activo ?? true,
    }
}

export async function GET() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const bancos = await prisma.paymentMethod.findMany({
        orderBy: [{ nombre: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(bancos)
}

export async function POST(req: NextRequest) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const body = normalizePayload(await req.json())

        if (!body.id || !body.nombre || !body.titular || !body.numeroCuenta) {
            return NextResponse.json(
                { message: 'ID, nombre, titular y número de cuenta son obligatorios' },
                { status: 400 }
            )
        }

        const created = await prisma.paymentMethod.create({
            data: body,
        })

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        console.error('Error creating payment method:', error)
        return NextResponse.json({ message: 'No se pudo crear el método de pago' }, { status: 500 })
    }
}
