import * as XLSX from 'xlsx'
import { getCurrentDateForFilename } from './export-utils'

export function generateInventoryTemplate() {
    const templateData = [
        {
            'ID Inventario': '',
            'Activo': 'SI',
            'Codigo / SKU': 'SILL-TIF-B',
            'Producto': 'Silla Tiffany Blanca',
            'Categoria': 'Mobiliario',
            'Subcategoria': 'Sillas',
            'Novedad': 'Nuevo',
            'Descripcion': 'Silla elegante para eventos formales',
            'Cantidad Total': 50,
            'Precio Unitario': 25.0,
            'Precio Reemplazo': 150.0,
        },
        {
            'ID Inventario': '',
            'Activo': 'SI',
            'Codigo / SKU': 'MES-REC-8',
            'Producto': 'Mesa Rectangular 8 personas',
            'Categoria': 'Mobiliario',
            'Subcategoria': 'Mesas',
            'Novedad': '',
            'Descripcion': 'Mesa plegable de madera, 2m x 0.8m',
            'Cantidad Total': 15,
            'Precio Unitario': 50.0,
            'Precio Reemplazo': 800.0,
        },
        {
            'ID Inventario': '',
            'Activo': '',
            'Codigo / SKU': '',
            'Producto': '',
            'Categoria': '',
            'Subcategoria': '',
            'Novedad': '',
            'Descripcion': '',
            'Cantidad Total': 0,
            'Precio Unitario': 0,
            'Precio Reemplazo': 0,
        },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Inventario')

    ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 35 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 40 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
    ]

    const instructions = [
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '1. Llena la hoja "Plantilla Inventario" con tus productos' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '2. No modifiques los nombres de las columnas' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '3. Campos obligatorios:' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Producto (Nombre)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Cantidad Total (numero entero)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Precio Unitario (numero)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Precio Reemplazo (precio de dano)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '4. Campos opcionales:' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - ID Inventario (solo para actualizar productos existentes)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Los productos nuevos deben dejar ese campo vacio; el sistema asigna el consecutivo automaticamente' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Activo (SI/NO) para habilitar o deshabilitar el articulo' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Codigo/SKU (para identificar rapido el producto)' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '   - Categoria, Subcategoria, Novedad y Descripcion' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '5. Elimina las filas de ejemplo antes de importar' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '6. Guarda el archivo y subelo en la opcion "Importar"' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': '' },
        { 'INSTRUCCIONES PARA IMPORTAR INVENTARIO': 'Nota: si un producto ya existe y envias su ID Inventario, se actualizara ese registro' },
    ]

    const wsInstructions = XLSX.utils.json_to_sheet(instructions)
    wsInstructions['!cols'] = [{ wch: 90 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')

    const filename = `plantilla_inventario_${getCurrentDateForFilename()}.xlsx`
    XLSX.writeFile(wb, filename)
}

export interface ImportedProduct {
    inventoryNumber?: number
    active?: boolean
    id?: string
    code?: string
    name: string
    category?: string
    subcategory?: string
    novedad?: string
    description?: string
    totalQuantity: number
    quantityDamaged?: number
    priceUnit: number
    priceReplacement: number
}

export interface ImportResult {
    success: boolean
    data?: ImportedProduct[]
    errors?: string[]
}

export function parseInventoryExcel(file: File): Promise<ImportResult> {
    return new Promise(resolve => {
        const reader = new FileReader()

        reader.onload = e => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })

                const sheetName = workbook.SheetNames.find(name =>
                    name.includes('Plantilla') || name.includes('Inventario')
                ) || workbook.SheetNames[0]

                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

                const products: ImportedProduct[] = []
                const errors: string[] = []

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2

                    const getValue = (keys: string[]) => {
                        for (const key of keys) {
                            if (row[key] !== undefined) return row[key]

                            const foundKey = Object.keys(row).find(existingKey =>
                                existingKey.toLowerCase().trim() === key.toLowerCase().trim()
                            )

                            if (foundKey) return row[foundKey]
                        }

                        return undefined
                    }

                    const parseNumber = (raw: unknown, allowDecimal = true): number => {
                        if (raw === undefined || raw === null || raw === '') return 0

                        const cleaned = raw
                            .toString()
                            .replace(/[$\s]/g, '')
                            .replace(/\./g, '')
                            .replace(/,/g, '.')

                        const parsed = allowDecimal ? parseFloat(cleaned) : parseInt(cleaned, 10)
                        return Number.isNaN(parsed) ? Number.NaN : parsed
                    }

                    const parsePositiveInteger = (raw: unknown): number | undefined => {
                        if (raw === undefined || raw === null || raw === '') return undefined

                        const parsed = parseInt(raw.toString().replace(/[^0-9]/g, ''), 10)
                        return Number.isNaN(parsed) ? Number.NaN : parsed
                    }

                    const parseBoolean = (raw: unknown): boolean | undefined => {
                        if (raw === undefined || raw === null || raw === '') return undefined

                        const normalized = raw.toString().trim().toLowerCase()

                        if (['si', 'sí', 'true', '1', 'activo', 'active', 'habilitado'].includes(normalized)) {
                            return true
                        }

                        if (['no', 'false', '0', 'inactivo', 'deshabilitado', 'disabled'].includes(normalized)) {
                            return false
                        }

                        return undefined
                    }

                    const name = getValue(['Nombre del Producto', 'Producto', 'Nombre'])?.toString().trim()

                    if (!name) {
                        const hasOtherData = [
                            'Cantidad Total', 'Cantidad', 'Stock', 'Total',
                            'Precio Unitario', 'Precio', 'Valor Unitario',
                            'Precio de Dano', 'Precio de Daño', 'Precio Reemplazo',
                            'Valor Dano', 'Valor Daño', 'Costo Reemplazo'
                        ].some(key => getValue([key]) !== undefined)

                        if (!hasOtherData) {
                            return
                        }

                        errors.push(`Fila ${rowNum}: Falta el nombre del producto (columna "Producto")`)
                        return
                    }

                    const totalQuantityRaw = getValue(['Cantidad Total', 'Cantidad', 'Stock', 'Total'])
                    const totalQuantity = totalQuantityRaw === undefined || totalQuantityRaw === null || totalQuantityRaw === ''
                        ? 0
                        : parseInt(totalQuantityRaw.toString().replace(/[^0-9]/g, '') || '0', 10)

                    if (Number.isNaN(totalQuantity) || totalQuantity < 0) {
                        errors.push(`Fila ${rowNum}: Cantidad Total debe ser un numero valido`)
                        return
                    }

                    const priceUnit = parseNumber(getValue(['Precio Unitario', 'Precio', 'Valor Unitario']))
                    if (Number.isNaN(priceUnit) || priceUnit < 0) {
                        errors.push(`Fila ${rowNum}: Precio Unitario debe ser un numero valido`)
                        return
                    }

                    const priceReplacement = parseNumber(
                        getValue([
                            'Precio de Dano',
                            'Precio de Daño',
                            'Precio Reemplazo',
                            'Valor Dano',
                            'Valor Daño',
                            'Costo Reemplazo',
                            'Precio de reemplazo',
                        ])
                    )

                    if (Number.isNaN(priceReplacement) || priceReplacement < 0) {
                        errors.push(`Fila ${rowNum}: Precio de dano/reemplazo debe ser un numero valido`)
                        return
                    }

                    const inventoryNumber = parsePositiveInteger(
                        getValue(['ID Inventario', 'ID de Inventario', 'Consecutivo'])
                    )

                    if (inventoryNumber !== undefined && (Number.isNaN(inventoryNumber) || inventoryNumber <= 0)) {
                        errors.push(`Fila ${rowNum}: ID Inventario debe ser un numero entero positivo`)
                        return
                    }

                    const product: ImportedProduct = {
                        inventoryNumber,
                        active: parseBoolean(getValue(['Activo', 'Estado'])),
                        id: getValue(['ID Interno', 'ID'])?.toString().trim() || undefined,
                        code: getValue(['Codigo / SKU', 'Codigo', 'Código', 'SKU'])?.toString().trim() || undefined,
                        name,
                        totalQuantity,
                        quantityDamaged: parseNumber(getValue(['Cantidad Danada', 'Cantidad Dañada', 'Danado', 'Dañado']), false),
                        priceUnit,
                        priceReplacement,
                        category: getValue(['Categoria', 'Categoría'])?.toString().trim() || undefined,
                        subcategory: getValue(['Subcategoria', 'Subcategoría'])?.toString().trim() || undefined,
                        novedad: getValue(['Novedad'])?.toString().trim() || undefined,
                        description: getValue(['Descripcion', 'Descripción'])?.toString().trim() || undefined,
                    }

                    products.push(product)
                })

                if (errors.length > 0) {
                    resolve({ success: false, errors })
                } else if (products.length === 0) {
                    resolve({ success: false, errors: ['No se encontraron productos validos en el archivo'] })
                } else {
                    resolve({ success: true, data: products })
                }
            } catch {
                resolve({
                    success: false,
                    errors: ['Error al leer el archivo. Asegurate de que sea un archivo Excel valido.'],
                })
            }
        }

        reader.onerror = () => {
            resolve({
                success: false,
                errors: ['Error al leer el archivo'],
            })
        }

        reader.readAsArrayBuffer(file)
    })
}
