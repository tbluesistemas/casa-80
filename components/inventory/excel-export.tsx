'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import * as XLSX from 'xlsx'

interface Product {
    id: string
    name: string
    category?: string | null
    description?: string | null
    totalQuantity: number
    priceReplacement: number
    updatedAt: string | Date
}

export function ExcelExport({ products }: { products: Product[] }) {
    const handleDownload = () => {
        const data = products.map(p => ({
            "Nombre": p.name,
            "Categoría": p.category || 'General',
            "Descripción": p.description || '',
            "Cantidad": p.totalQuantity,
            "Precio de Daño": p.priceReplacement,
            "Última Actualización": new Date(p.updatedAt).toLocaleDateString()
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Inventario")
        XLSX.writeFile(wb, "Inventario_Casa80.xlsx")
    }

    return (
        <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Excel
        </Button>
    )
}
