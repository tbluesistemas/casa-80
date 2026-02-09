import * as XLSX from 'xlsx'
import { getCurrentDateForFilename } from './export-utils'

export function generateInventoryTemplate() {
    // Datos de ejemplo para la plantilla
    const templateData = [
        {
            'Producto': 'Silla Tiffany Blanca',
            'Categoría': 'Mobiliario',
            'Descripción': 'Silla elegante para eventos formales',
            'Cantidad Total': 50,
            'Precio Unitario': 25.00,
            'Precio Reemplazo': 150.00
        },
        {
            'Producto': 'Mesa Rectangular 8 personas',
            'Categoría': 'Mobiliario',
            'Descripción': 'Mesa plegable de madera, 2m x 0.8m',
            'Cantidad Total': 15,
            'Precio Unitario': 50.00,
            'Precio Reemplazo': 800.00
        },
        {
            'Producto': '',
            'Categoría': '',
            'Descripción': '',
            'Cantidad Total': 0,
            'Precio Unitario': 0,
            'Precio Reemplazo': 0
        }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Inventario')

    // Configurar ancho de columnas
    const colWidths = [
        { wch: 35 }, // Producto
        { wch: 20 }, // Categoría
        { wch: 40 }, // Descripción
        { wch: 15 }, // Cantidad Total
        { wch: 18 }, // Precio Unitario
        { wch: 18 }, // Precio Reemplazo
    ]
    ws['!cols'] = colWidths

    // Agregar hoja de instrucciones
    const instructions = [
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '1. Llena la hoja "Plantilla Inventario" con tus productos' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '2. NO modifiques los nombres de las columnas' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '3. Campos OBLIGATORIOS:' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Producto (Nombre)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Cantidad Total (número entero)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Precio Unitario (número)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Precio Reemplazo (Precio de daño)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '4. Campos OPCIONALES:' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Categoría' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Descripción' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '5. Elimina las filas de ejemplo antes de importar' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '6. Guarda el archivo y súbelo en la opción "Importar"' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': 'NOTA: Si un producto ya existe (mismo nombre), se actualizará' },
    ]

    const wsInstructions = XLSX.utils.json_to_sheet(instructions)
    wsInstructions['!cols'] = [{ wch: 60 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')

    const filename = `plantilla_inventario_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export interface ImportedProduct {
    name: string
    category?: string
    description?: string
    totalQuantity: number
    priceUnit: number
    priceReplacement: number
}

export interface ImportResult {
    success: boolean
    data?: ImportedProduct[]
    errors?: string[]
}

export function parseInventoryExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })

                // Buscar la hoja de plantilla
                const sheetName = workbook.SheetNames.find(name =>
                    name.includes('Plantilla') || name.includes('Inventario')
                ) || workbook.SheetNames[0]

                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

                const products: ImportedProduct[] = []
                const errors: string[] = []

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2 // +2 porque Excel empieza en 1 y hay header

                    // Helper to find value by potential keys
                    const getValue = (keys: string[]) => {
                        for (const key of keys) {
                            if (row[key] !== undefined) return row[key]
                            // Also try case insensitive
                            const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase().trim())
                            if (foundKey) return row[foundKey]
                        }
                        return undefined
                    }

                    // Validar campos obligatorios
                    const name = getValue(['Nombre del Producto', 'Producto', 'Nombre'])?.toString().trim()

                    // Check if row is completely empty (common artifact in Excel)
                    if (!name) {
                        const hasOtherData = [
                            'Cantidad Total', 'Cantidad', 'Stock', 'Total',
                            'Precio Unitario', 'Precio', 'Valor Unitario',
                            'Precio de Daño', 'Precio Reemplazo', 'Valor Daño', 'Costo Reemplazo'
                        ].some(key => getValue([key]) !== undefined)

                        if (!hasOtherData) {
                            return // Skip empty row
                        }

                        errors.push(`Fila ${rowNum}: Falta el nombre del producto (Columna 'Producto' o 'Nombre del Producto')`)
                        return
                    }

                    const quantityRaw = getValue(['Cantidad Total', 'Cantidad', 'Stock', 'Total'])
                    const totalQuantity = parseInt(quantityRaw)
                    if (isNaN(totalQuantity) || totalQuantity < 0) { // Changed to allow 0 if needed, but usually > 0 for import
                        errors.push(`Fila ${rowNum}: Cantidad Total debe ser un número válido`)
                        return
                    }

                    const priceUnitRaw = getValue(['Precio Unitario', 'Precio', 'Valor Unitario'])
                    const priceUnit = parseFloat(priceUnitRaw)
                    if (isNaN(priceUnit) || priceUnit < 0) {
                        errors.push(`Fila ${rowNum}: Precio Unitario debe ser un número válido`)
                        return
                    }

                    const priceReplacementRaw = getValue(['Precio de Daño', 'Precio Reemplazo', 'Valor Daño', 'Costo Reemplazo'])
                    const priceReplacement = parseFloat(priceReplacementRaw)
                    if (isNaN(priceReplacement) || priceReplacement < 0) {
                        errors.push(`Fila ${rowNum}: Precio de Daño/Reemplazo debe ser un número válido`)
                        return
                    }

                    // Crear objeto de producto
                    const product: ImportedProduct = {
                        name,
                        totalQuantity,
                        priceUnit,
                        priceReplacement,
                        category: getValue(['Categoría', 'Categoria'])?.toString().trim() || undefined,
                        description: getValue(['Descripción', 'Descripcion'])?.toString().trim() || undefined,
                    }

                    products.push(product)
                })

                if (errors.length > 0) {
                    resolve({ success: false, errors })
                } else if (products.length === 0) {
                    resolve({ success: false, errors: ['No se encontraron productos válidos en el archivo'] })
                } else {
                    resolve({ success: true, data: products })
                }
            } catch (error) {
                resolve({
                    success: false,
                    errors: ['Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.']
                })
            }
        }

        reader.onerror = () => {
            resolve({
                success: false,
                errors: ['Error al leer el archivo']
            })
        }

        reader.readAsArrayBuffer(file)
    })
}
