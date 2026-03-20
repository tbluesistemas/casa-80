'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Package, DollarSign, Archive, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

interface ProductDetailsProps {
    product: {
        id: string
        name: string
        description?: string | null
        category?: string | null
        imageUrl?: string | null
        totalQuantity: number
        quantityDamaged?: number
        priceUnit?: number
        priceReplacement: number
        updatedAt?: Date | string
    }
    children: React.ReactNode
}

export function ProductDetailsDialog({ product, children }: ProductDetailsProps) {
    return (
        <Dialog>
            <DialogTrigger asChild className="cursor-pointer hover:opacity-80 transition-opacity">
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {product.name}
                        {product.category && <Badge variant="secondary">{product.category}</Badge>}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {product.imageUrl ? (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted">
                            <Image 
                                src={product.imageUrl} 
                                alt={product.name} 
                                fill 
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center py-4 bg-muted/20 rounded-lg border border-dashed">
                            <Package className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                    )}

                    {product.description && (
                        <div className="text-sm text-muted-foreground">
                            {product.description}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Valor Daño</span>
                            </div>
                            <span className="text-xl font-bold text-red-700">
                                ${product.priceReplacement.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex flex-col p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Cant. Dañada</span>
                            </div>
                            <span className="text-xl font-bold text-orange-700">
                                {product.quantityDamaged || 0}
                            </span>
                        </div>

                        <div className="flex flex-col p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Archive className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase">Stock Total</span>
                            </div>
                            <span className="text-xl font-bold text-blue-700">
                                {product.totalQuantity}
                            </span>
                        </div>
                    </div>

                    {product.updatedAt && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                            Actualizado: {format(new Date(product.updatedAt), "dd/MM/yyyy HH:mm")}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
