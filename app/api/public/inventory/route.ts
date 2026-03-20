import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                category: true,
                subcategory: true,
                novedad: true,
                description: true,
                imageUrl: true,
                totalQuantity: true,
                priceUnit: true,
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json(
            { success: true, count: products.length, data: products },
            { status: 200, headers: corsHeaders }
        )
    } catch (error) {
        console.error('Error fetching public inventory:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500, headers: corsHeaders }
        )
    }
}
