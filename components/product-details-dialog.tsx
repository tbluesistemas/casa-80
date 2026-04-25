'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { getPrimaryProductImage, normalizeProductImageUrls } from "@/lib/product-images"

interface ProductDetailsProps {
    product: {
        id: string
        inventoryNumber?: number
        active?: boolean
        code?: string | null
        name: string
        description?: string | null
        category?: string | null
        imageUrl?: string | null
        imageUrls?: string[]
        totalQuantity: number
        quantityDamaged?: number
        priceUnit?: number
        priceReplacement: number
        updatedAt?: Date | string
    }
    children: React.ReactNode
}

export function ProductDetailsDialog({ product, children }: ProductDetailsProps) {
    const [open, setOpen] = useState(false)
    const images = useMemo(() => normalizeProductImageUrls(product), [product])
    const primaryImage = getPrimaryProductImage(product)
    const [selectedImage, setSelectedImage] = useState(primaryImage)

    useEffect(() => {
        if (open) {
            setSelectedImage(primaryImage)
        }
    }, [open, primaryImage, product.id])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className="cursor-pointer hover:opacity-80 transition-opacity">
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                        {product.name}
                        {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
                        {images.length > 1 ? <Badge variant="outline">{images.length} fotos</Badge> : null}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {product.inventoryNumber ? (
                            <Badge variant="outline">ID Inventario #{product.inventoryNumber}</Badge>
                        ) : null}
                        {product.active === false ? (
                            <Badge variant="destructive">Deshabilitado</Badge>
                        ) : null}
                        {product.code ? (
                            <Badge variant="secondary">SKU {product.code}</Badge>
                        ) : null}
                    </div>

                    {selectedImage ? (
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm border bg-white group">
                            <Image
                                src={selectedImage}
                                alt={product.name}
                                fill
                                sizes="(min-width: 640px) 520px, 100vw"
                                quality={100}
                                className="object-contain p-3"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                        </div>
                    ) : (
                        <div className="flex justify-center py-8 bg-muted/20 rounded-xl border border-dashed">
                            <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                    )}

                    {images.length > 1 ? (
                        <div className="grid grid-cols-5 gap-3">
                            {images.map((url, index) => {
                                const isSelected = url === selectedImage

                                return (
                                    <button
                                        key={`${url}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImage(url)}
                                        className={`relative aspect-square overflow-hidden rounded-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary ring-offset-2 opacity-100' : 'hover:ring-2 hover:ring-primary/50 opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image
                                            src={url}
                                            alt={`${product.name} ${index + 1}`}
                                            fill
                                            sizes="80px"
                                            quality={100}
                                            className="object-contain bg-white p-1"
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}

                    {product.description ? (
                        <div className="text-sm text-muted-foreground mt-2">
                            {product.description}
                        </div>
                    ) : null}

                    {product.updatedAt ? (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                            Actualizado: {format(new Date(product.updatedAt), "dd/MM/yyyy HH:mm")}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
