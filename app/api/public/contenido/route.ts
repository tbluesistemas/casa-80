import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const tipo = searchParams.get('tipo') // Optional filter: hero, galeria, nosotros, etc.

        const url = new URL(`${BACKEND_URL}/api/contenido`)
        if (tipo) url.searchParams.set('tipo', tipo)

        const res = await fetch(url.toString(), {
            headers: { 'x-api-key': API_KEY },
            cache: 'no-store',
        })

        if (!res.ok) {
            return NextResponse.json(
                { success: false, error: 'No se pudo obtener el contenido' },
                { status: 502, headers: corsHeaders }
            )
        }

        const data = await res.json()

        // Only expose active sections, sorted by orden
        const secciones = Array.isArray(data)
            ? data
                .filter((s: any) => s.activo !== false)
                .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
            : []

        return NextResponse.json(
            { success: true, count: secciones.length, data: secciones },
            { status: 200, headers: corsHeaders }
        )
    } catch {
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
