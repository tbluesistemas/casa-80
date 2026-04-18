import { NextRequest, NextResponse } from 'next/server'
import { getCurrentRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PaymentPayload = {
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
        nombre: body.nombre?.trim() || '',
        color: body.color?.trim() || '#000000',
        titular: body.titular?.trim() || '',
        numeroCuenta: body.numeroCuenta?.trim() || '',
        cci: body.cci?.trim() || '',
        qrImageUrl: body.qrImageUrl?.trim() || '',
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

        if (!body.nombre || !body.titular || !body.numeroCuenta) {
            return NextResponse.json(
                { message: 'Nombre, titular y número de cuenta son obligatorios' },
                { status: 400 }
            )
        }

        const updated = await prisma.paymentMethod.update({
            where: { id },
            data: body,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating payment method:', error)
        return NextResponse.json({ message: 'No se pudo actualizar el método de pago' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    try {
        const { id } = await params
        await prisma.paymentMethod.delete({
            where: { id },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting payment method:', error)
        return NextResponse.json({ message: 'No se pudo eliminar el método de pago' }, { status: 500 })
    }
}
