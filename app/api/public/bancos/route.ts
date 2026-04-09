import { NextResponse } from 'next/server'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'
const API_KEY = process.env.BACKEND_API_KEY || 'casa80-api-key-2024'

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/bancos`, {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        })

        if (!res.ok) {
            return NextResponse.json(
                { success: false, error: 'No se pudo obtener los métodos de pago' },
                { status: 502, headers: corsHeaders }
            )
        }

        const data = await res.json()

        // Only expose active banks and filter sensitive/internal fields
        const bancos = Array.isArray(data)
            ? data
                .filter((b: any) => b.activo !== false)
                .map((b: any) => ({
                    id: b.id,
                    nombre: b.nombre,
                    color: b.color,
                    titular: b.titular,
                    numeroCuenta: b.numeroCuenta,
                    cci: b.cci,
                    qrImageUrl: b.qrImageUrl,
                }))
            : []

        return NextResponse.json(
            { success: true, count: bancos.length, data: bancos },
            { status: 200, headers: corsHeaders }
        )
    } catch {
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
