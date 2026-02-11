'use client'

import { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/export/export-button"
import { ImportInventoryButton } from "@/components/import/import-inventory-button"
import { HistoryDialog } from "@/components/inventory/history-dialog"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { EditProductDialog } from "@/components/inventory/edit-product-dialog"
import { CreateProductDialog } from "@/components/inventory/create-product-dialog"
import { DeleteProductDialog } from "@/components/inventory/delete-product-dialog"
import { format } from "date-fns"
import { Search, Eye, EyeOff, DollarSign, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Product {
    id: string
    name: string
    category?: string | null
    description?: string | null
    totalQuantity: number
    quantityDamaged: number
    priceUnit?: number
    priceReplacement: number
    updatedAt: string | Date
    createdAt?: string | Date
    availableQuantity?: number
}

import { useAuth } from '@/components/auth-provider'

export function InventoryClient({ products }: { products: Product[] }) {
    const { role } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [showTotalValue, setShowTotalValue] = useState(false)

    // Calculate total inventory value
    const totalInventoryValue = useMemo(() => {
        return products.reduce((acc, product) => {
            return acc + (product.totalQuantity * (product.priceUnit || 0))
        }, 0)
    }, [products])

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'General'))
        return Array.from(cats).sort()
    }, [products])

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === 'all' ||
                (product.category || 'General') === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [products, searchQuery, categoryFilter])

    return (
        <div className="flex-1 space-y-4 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Inventario</h2>
                <div className="flex items-center gap-4">
                    {role === 'ADMIN' && (
                        <Card className="bg-muted/30 border-muted">
                            <CardContent className="p-2 px-4 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                                        Valor Total
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg tabular-nums">
                                            {showTotalValue
                                                ? `$${totalInventoryValue.toLocaleString()}`
                                                : "•••••••"}
                                        </span>
                                        <button
                                            onClick={() => setShowTotalValue(!showTotalValue)}
                                            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                            aria-label={showTotalValue ? "Ocultar valor" : "Mostrar valor"}
                                        >
                                            {showTotalValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="flex gap-2 bg-muted/50 p-1 rounded-lg w-fit h-fit">
                        <Link href="/inventory/damages">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="hidden sm:inline">Historial de Daños</span>
                            </Button>
                        </Link>
                        {role === 'ADMIN' && <CreateProductDialog />}
                        {role === 'ADMIN' && <ImportInventoryButton />}
                        <ExportButton segment="inventory" variant="ghost" size="sm" />
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <CardTitle>Productos Disponibles</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las categorías</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[80px]">Cat.</TableHead>
                                    <TableHead className="min-w-[200px]">Nombre / Descripción</TableHead>
                                    <TableHead className="text-right min-w-[80px]">Total</TableHead>
                                    <TableHead className="text-right min-w-[80px]">Disponible</TableHead>
                                    <TableHead className="text-right min-w-[80px] text-red-600">Dañado</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Valor Unitario</TableHead>
                                    <TableHead className="text-right min-w-[100px]">Valor Daño</TableHead>
                                    <TableHead className="text-right min-w-[140px]">Última Actualización</TableHead>
                                    <TableHead className="min-w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            {searchQuery || categoryFilter !== 'all'
                                                ? 'No se encontraron productos con esos filtros.'
                                                : 'No hay productos registrados.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {product.category || 'General'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <ProductDetailsDialog product={product}>
                                                    <div className="flex flex-col cursor-pointer hover:underline decoration-dotted decoration-muted-foreground/50">
                                                        <span className="font-medium text-primary">{product.name}</span>
                                                        {product.description && (
                                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {product.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </ProductDetailsDialog>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-muted-foreground">{product.totalQuantity}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {product.availableQuantity !== undefined
                                                    ? product.availableQuantity
                                                    : (product.totalQuantity - (product.quantityDamaged || 0))}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                {product.quantityDamaged || 0}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${(product.priceUnit || 0).toFixed(0)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${product.priceReplacement.toFixed(0)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {format(new Date(product.updatedAt), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {role === 'ADMIN' && <EditProductDialog product={product} />}
                                                    {role === 'ADMIN' && <DeleteProductDialog productId={product.id} productName={product.name} />}
                                                    <HistoryDialog
                                                        productId={product.id}
                                                        productName={product.name}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
