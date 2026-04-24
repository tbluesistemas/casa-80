'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from "@/components/ui/checkbox"
import { ExportButton } from "@/components/export/export-button"
import { ImportInventoryButton } from "@/components/import/import-inventory-button"
import { HistoryDialog } from "@/components/inventory/history-dialog"
import { ProductDetailsDialog } from "@/components/product-details-dialog"
import { EditProductDialog } from "@/components/inventory/edit-product-dialog"
import { CreateProductDialog } from "@/components/inventory/create-product-dialog"
import { DeleteProductDialog } from "@/components/inventory/delete-product-dialog"
import Image from 'next/image'
import { deleteProduct, toggleProductActive } from "@/lib/actions"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import { Search, Eye, EyeOff, DollarSign, AlertTriangle, Trash2, X, ArrowUpDown, ImageIcon, Loader2, Power, PowerOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getPrimaryProductImage, normalizeProductImageUrls } from "@/lib/product-images"

interface Product {
    id: string
    inventoryNumber: number
    active: boolean
    code?: string | null
    name: string
    category?: string | null
    subcategory?: string | null
    novedad?: string | null
    description?: string | null
    totalQuantity: number
    quantityDamaged: number
    priceUnit?: number
    priceReplacement: number
    updatedAt: string | Date
    createdAt?: string | Date
    availableQuantity?: number
    imageUrl?: string | null
    imageUrls?: string[]
}

import { useAuth } from '@/components/auth-provider'

type SortOption =
    | 'name-asc' | 'name-desc'
    | 'quantity-asc' | 'quantity-desc'
    | 'price-asc' | 'price-desc'
    | 'date-asc' | 'date-desc'

function getProductCardImage(product: Product) {
    return getPrimaryProductImage(product)
}

function getProductImageCount(product: Product) {
    return normalizeProductImageUrls(product).length
}

export function InventoryClient({ products }: { products: Product[] }) {
    const router = useRouter()
    const { role } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<SortOption>('name-asc')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deletingBulk, setDeletingBulk] = useState(false)
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
    const [displayLimit, setDisplayLimit] = useState(50)

    const totalInventoryValue = useMemo(() => {
        return products.reduce((acc, product) => {
            return acc + (product.totalQuantity * (product.priceUnit || 0))
        }, 0)
    }, [products])

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'General'))
        return Array.from(cats).sort()
    }, [products])

    const filteredAndSorted = useMemo(() => {
        const filtered = products.filter(product => {
            const matchesSearch =
                product.inventoryNumber?.toString().includes(searchQuery.trim()) ||
                product.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === 'all' ||
                (product.category || 'General') === categoryFilter
            return matchesSearch && matchesCategory
        })

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name, 'es')
                case 'name-desc': return b.name.localeCompare(a.name, 'es')
                case 'quantity-asc': return a.totalQuantity - b.totalQuantity
                case 'quantity-desc': return b.totalQuantity - a.totalQuantity
                case 'price-asc': return (a.priceUnit || 0) - (b.priceUnit || 0)
                case 'price-desc': return (b.priceUnit || 0) - (a.priceUnit || 0)
                case 'date-asc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                case 'date-desc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                default: return 0
            }
        })
    }, [products, searchQuery, categoryFilter, sortBy])

    const visibleProducts = useMemo(() => {
        return filteredAndSorted.slice(0, displayLimit)
    }, [filteredAndSorted, displayLimit])

    const hasMore = displayLimit < filteredAndSorted.length

    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 50)
    }

    // Selection helpers
    const allFilteredSelected = filteredAndSorted.length > 0 &&
        filteredAndSorted.every(p => selectedIds.has(p.id))
    const someSelected = selectedIds.size > 0
    const indeterminate = someSelected && !allFilteredSelected

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSorted.map(p => p.id)))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const clearSelection = () => setSelectedIds(new Set())

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Eliminar ${selectedIds.size} producto(s)? Esta acción no se puede deshacer.`)) return
        setDeletingBulk(true)
        let errors = 0
        for (const id of selectedIds) {
            const result = await deleteProduct(id)
            if (!result.success) errors++
        }
        setDeletingBulk(false)
        clearSelection()
        if (errors > 0) {
            toast.error(`${errors} producto(s) no pudieron eliminarse (probablemente tienen eventos asociados)`)
        } else {
            toast.success('Productos eliminados correctamente')
        }
        router.refresh()
    }

    const handleToggleActive = async (product: Product) => {
        setTogglingIds(prev => new Set(prev).add(product.id))

        const result = await toggleProductActive(product.id)

        setTogglingIds(prev => {
            const next = new Set(prev)
            next.delete(product.id)
            return next
        })

        if (!result.success || !result.data) {
            toast.error(result.error || 'No se pudo actualizar el estado del producto')
            return
        }

        if (!result.data.active && result.data.upcomingEventCount > 0) {
            toast.warning(
                `${result.data.name} quedó deshabilitado. Tiene ${result.data.upcomingEventCount} reserva(s) activa(s), así que ya no saldrá para nuevas reservas.`
            )
        } else {
            toast.success(result.data.active ? 'Producto reactivado' : 'Producto deshabilitado')
        }

        router.refresh()
    }

    return (
        <div className="flex-1 space-y-4 md:space-y-6 p-3 sm:p-4 md:p-8 pt-3 sm:pt-4 md:pt-6">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Inventario</h2>
                    {role === 'ADMIN' && (
                        <TotalValueCard totalValue={totalInventoryValue} />
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 sm:gap-2 bg-muted/50 p-1 rounded-lg flex-wrap">
                        <Link href="/inventory/damages">
                            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span className="hidden xs:inline text-xs sm:text-sm">Daños</span>
                            </Button>
                        </Link>
                        {role === 'ADMIN' && <CreateProductDialog />}
                        {role === 'ADMIN' && <ImportInventoryButton />}
                        <ExportButton segment="inventory" variant="ghost" size="sm" />
                    </div>
                </div>
            </div>

            {/* Bulk action bar */}
            {someSelected && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <span className="text-sm font-semibold text-primary">
                        {selectedIds.size} producto{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-1" />
                    {role === 'ADMIN' && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={deletingBulk}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            {deletingBulk ? 'Eliminando...' : 'Eliminar seleccionados'}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        className="gap-1"
                    >
                        <X className="h-4 w-4" />
                        Deseleccionar
                    </Button>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <CardTitle>Productos Disponibles</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            {/* Category filter */}
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
                            {/* Sort */}
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Ordenar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name-asc">Nombre A → Z</SelectItem>
                                    <SelectItem value="name-desc">Nombre Z → A</SelectItem>
                                    <SelectItem value="quantity-desc">Cantidad ↓ Mayor</SelectItem>
                                    <SelectItem value="quantity-asc">Cantidad ↑ Menor</SelectItem>
                                    <SelectItem value="price-desc">Precio ↓ Mayor</SelectItem>
                                    <SelectItem value="price-asc">Precio ↑ Menor</SelectItem>
                                    <SelectItem value="date-desc">Más reciente primero</SelectItem>
                                    <SelectItem value="date-asc">Más antiguo primero</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile: Grid Cards */}
                    <div className="md:hidden p-3 grid grid-cols-2 gap-3 bg-muted/10">
                        {visibleProducts.length === 0 ? (
                            <div className="col-span-2 text-center text-muted-foreground py-12">
                                {searchQuery || categoryFilter !== 'all' ? 'No se encontraron productos con esos filtros.' : 'No hay productos registrados.'}
                            </div>
                        ) : visibleProducts.map((product) => {
                            const productImage = getProductCardImage(product)
                            const imageCount = getProductImageCount(product)

                            return (
                                <div
                                    key={product.id}
                                    className={`relative flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md ${product.active ? '' : 'opacity-70 border-dashed border-red-300 bg-red-50/40'}`}
                                >
                                <div className="absolute top-2 left-2 z-10">
                                    <Checkbox
                                        checked={selectedIds.has(product.id)}
                                        onCheckedChange={() => toggleSelect(product.id)}
                                        className="bg-background shadow-sm data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <div className="absolute top-2 right-2 z-10">
                                    {role === 'ADMIN' && <DeleteProductDialog productId={product.id} productName={product.name} />}
                                </div>
                                
                                {productImage ? (
                                    <ProductDetailsDialog product={product}>
                                        <div className="relative w-full aspect-square bg-muted border-b cursor-pointer transition-opacity hover:opacity-90">
                                            <Image
                                                src={productImage}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                            {imageCount > 1 && (
                                                <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow">
                                                    {imageCount} fotos
                                                </span>
                                            )}
                                        </div>
                                    </ProductDetailsDialog>
                                ) : (
                                    <ProductDetailsDialog product={product}>
                                        <div className="relative w-full aspect-square bg-muted/50 border-b flex items-center justify-center cursor-pointer hover:bg-muted/70">
                                            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                    </ProductDetailsDialog>
                                )}
                                
                                <div className="p-3 flex flex-col flex-1 gap-2">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                            {product.inventoryNumber ? (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                    #{product.inventoryNumber}
                                                </span>
                                            ) : null}
                                            {!product.active ? (
                                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                    Deshabilitado
                                                </span>
                                            ) : null}
                                            {product.code ? (
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    SKU {product.code}
                                                </span>
                                            ) : null}
                                        </div>
                                        {role === 'ADMIN' ? (
                                            <EditProductDialog product={product}>
                                                <span className="font-semibold text-primary text-sm hover:underline cursor-pointer line-clamp-2 leading-tight">{product.name}</span>
                                            </EditProductDialog>
                                        ) : (
                                            <ProductDetailsDialog product={product}>
                                                <span className="font-semibold text-sm hover:underline cursor-pointer line-clamp-2 leading-tight">{product.name}</span>
                                            </ProductDetailsDialog>
                                        )}
                                        {product.category && (
                                            <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}</span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-auto pt-2 grid grid-cols-2 gap-1 text-center text-[10px] uppercase font-bold tracking-wider">
                                        <div className="bg-blue-50 text-blue-700 rounded-md p-1.5 flex flex-col">
                                            <span className="text-sm">{product.totalQuantity}</span>
                                            <span>Total</span>
                                        </div>
                                        <div className="bg-green-50 text-green-700 rounded-md p-1.5 flex flex-col">
                                            <span className="text-sm">
                                                {product.availableQuantity !== undefined ? product.availableQuantity : (product.totalQuantity - (product.quantityDamaged || 0))}
                                            </span>
                                            <span>Disp</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-xs">
                                        <span className="font-medium text-muted-foreground">Unit:</span>
                                        <strong className="text-foreground">{formatCurrency(product.priceUnit || 0)}</strong>
                                    </div>
                                    {role === 'ADMIN' && (
                                        <Button
                                            type="button"
                                            variant={product.active ? 'outline' : 'secondary'}
                                            size="sm"
                                            onClick={() => handleToggleActive(product)}
                                            disabled={togglingIds.has(product.id)}
                                            className="mt-2 h-8 text-xs"
                                        >
                                            {togglingIds.has(product.id) ? (
                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                            ) : product.active ? (
                                                <PowerOff className="mr-2 h-3.5 w-3.5" />
                                            ) : (
                                                <Power className="mr-2 h-3.5 w-3.5" />
                                            )}
                                            {product.active ? 'Deshabilitar' : 'Reactivar'}
                                        </Button>
                                    )}
                                </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={allFilteredSelected}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Seleccionar todos"
                                            // indeterminate state via data attr
                                            data-state={indeterminate ? 'indeterminate' : allFilteredSelected ? 'checked' : 'unchecked'}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[160px]">Foto</TableHead>
                                    <TableHead className="w-[140px]">ID Inventario</TableHead>
                                    <TableHead className="w-[140px] max-w-[140px]">Categoría</TableHead>
                                    <TableHead className="min-w-[180px]">Nombre / Descripción</TableHead>
                                    <TableHead className="text-right w-[70px]">Total</TableHead>
                                    <TableHead className="text-right w-[80px]">Disponible</TableHead>
                                    <TableHead className="text-right w-[70px] text-red-600">Dañado</TableHead>
                                    <TableHead className="text-right w-[110px]">Valor Unit.</TableHead>
                                    <TableHead className="text-right w-[100px]">Valor Daño</TableHead>
                                    <TableHead className="text-right w-[120px]">Actualización</TableHead>
                                    <TableHead className="w-[112px] sticky right-0 bg-background z-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                                            {searchQuery || categoryFilter !== 'all'
                                                ? 'No se encontraron productos con esos filtros.'
                                                : 'No hay productos registrados.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visibleProducts.map((product) => {
                                        const isSelected = selectedIds.has(product.id)
                                        const productImage = getProductCardImage(product)
                                        const imageCount = getProductImageCount(product)
                                        return (
                                            <TableRow
                                                key={product.id}
                                                data-selected={isSelected}
                                                className={`${isSelected ? 'bg-primary/5' : ''} ${product.active ? '' : 'opacity-70 bg-red-50/40'}`}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelect(product.id)}
                                                        aria-label={`Seleccionar ${product.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <ProductDetailsDialog product={product}>
                                                        {productImage ? (
                                                            <div className="relative h-36 w-36 rounded-xl overflow-hidden border-2 bg-muted shadow hover:scale-105 transition-transform origin-left z-20 cursor-pointer">
                                                                <Image
                                                                    src={productImage}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="144px"
                                                                />
                                                                {imageCount > 1 && (
                                                                    <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow">
                                                                        {imageCount} fotos
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-36 w-36 rounded-xl border-2 bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80">
                                                                <ImageIcon className="h-10 w-10 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                                                            </div>
                                                        )}
                                                    </ProductDetailsDialog>
                                                </TableCell>
                                                <TableCell className="w-[140px]">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono text-sm font-semibold text-foreground">
                                                            {product.inventoryNumber ? `#${product.inventoryNumber}` : '-'}
                                                        </span>
                                                        {product.code ? (
                                                            <span className="font-mono text-[11px] text-muted-foreground">
                                                                SKU {product.code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/50 text-[11px] italic">
                                                                Sin SKU
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="w-[160px] max-w-[160px]">
                                                    <div className="flex flex-col gap-1 max-w-full">
                                                        <span
                                                            title={product.category || 'General'}
                                                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 max-w-full truncate block"
                                                        >
                                                            {product.category || 'General'}
                                                        </span>
                                                        {product.subcategory && (
                                                            <span
                                                                title={product.subcategory}
                                                                className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 max-w-full truncate block"
                                                            >
                                                                {product.subcategory}
                                                            </span>
                                                        )}
                                                        {product.novedad && (
                                                            <span
                                                                title={product.novedad}
                                                                className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10 max-w-full truncate block"
                                                            >
                                                                {product.novedad}
                                                            </span>
                                                        )}
                                                        {!product.active && (
                                                            <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/10 max-w-full truncate block">
                                                                Deshabilitado
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {role === 'ADMIN' ? (
                                                        <EditProductDialog product={product}>
                                                            <div className="flex flex-col cursor-pointer">
                                                                <span className="font-medium text-primary hover:underline underline-offset-2">{product.name}</span>
                                                                {!product.active && (
                                                                    <span className="text-[11px] font-medium text-red-600">
                                                                        Fuera de uso para nuevas reservas
                                                                    </span>
                                                                )}
                                                                {product.description && (
                                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                        {product.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </EditProductDialog>
                                                    ) : (
                                                        <ProductDetailsDialog product={product}>
                                                            <div className="flex flex-col cursor-pointer hover:underline decoration-dotted decoration-muted-foreground/50">
                                                                <span className="font-medium text-primary">{product.name}</span>
                                                                {!product.active && (
                                                                    <span className="text-[11px] font-medium text-red-600">
                                                                        Fuera de uso para nuevas reservas
                                                                    </span>
                                                                )}
                                                                {product.description && (
                                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                        {product.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </ProductDetailsDialog>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-muted-foreground">{product.totalQuantity}</TableCell>
                                                <TableCell className={`text-right font-bold ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {product.active
                                                        ? (product.availableQuantity !== undefined
                                                            ? product.availableQuantity
                                                            : (product.totalQuantity - (product.quantityDamaged || 0)))
                                                        : 0}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-600">
                                                    {product.quantityDamaged || 0}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(product.priceUnit || 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(product.priceReplacement)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-xs">
                                                    {format(new Date(product.updatedAt), "dd/MM/yyyy HH:mm")}
                                                </TableCell>
                                                <TableCell className={`sticky right-0 ${product.active ? 'bg-background' : 'bg-red-50/40'}`}>
                                                    <div className="flex items-center gap-1 flex-nowrap">
                                                        {role === 'ADMIN' && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleToggleActive(product)}
                                                                disabled={togglingIds.has(product.id)}
                                                                title={product.active ? 'Deshabilitar producto' : 'Reactivar producto'}
                                                            >
                                                                {togglingIds.has(product.id) ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : product.active ? (
                                                                    <PowerOff className="h-4 w-4 text-red-600" />
                                                                ) : (
                                                                    <Power className="h-4 w-4 text-emerald-600" />
                                                                )}
                                                            </Button>
                                                        )}
                                                        {role === 'ADMIN' && <DeleteProductDialog productId={product.id} productName={product.name} />}
                                                        <HistoryDialog
                                                            productId={product.id}
                                                            productName={product.name}
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer summary */}
                    {filteredAndSorted.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
                            <span>
                                {filteredAndSorted.length} producto{filteredAndSorted.length !== 1 ? 's' : ''}
                                {searchQuery || categoryFilter !== 'all' ? ' (filtrados)' : ''}
                            </span>
                            {someSelected && (
                                <span className="text-primary font-medium">
                                    {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                    {hasMore && (
                        <div className="flex justify-center py-6 border-t bg-muted/10">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                className="gap-2 px-8"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                                Cargar 50 productos más ({filteredAndSorted.length - visibleProducts.length} restantes)
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function TotalValueCard({ totalValue }: { totalValue: number }) {
    const [showValue, setShowValue] = useState(false)

    return (
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
                            {showValue
                                ? formatCurrency(totalValue)
                                : "•••••••"}
                        </span>
                        <button
                            onClick={() => setShowValue(!showValue)}
                            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                            aria-label={showValue ? "Ocultar valor" : "Mostrar valor"}
                        >
                            {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
