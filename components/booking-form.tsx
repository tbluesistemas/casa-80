'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createEvent, CreateEventItem, getProducts } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Minus, Plus, Search, ShoppingCart, Package, DollarSign, Loader2, Printer, Save } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ClientSelector } from '@/components/client-selector'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProductDetailsDialog } from "@/components/product-details-dialog"

type Product = {
    id: string
    name: string
    totalQuantity: number
    priceUnit?: number
    description?: string | null
    availableQuantity?: number
    imageUrl?: string | null
    imageUrls?: string[]
    category?: string | null
    subcategory?: string | null
    novedad?: string | null
    priceReplacement: number
    quantityDamaged?: number
}

// Internal type for easier state management
type CartItems = { [key: string]: number }

export function BookingForm({ products: initialProducts }: { products: Product[] }) {
    const { role } = useAuth()
    const router = useRouter()

    // Form State
    const [name, setName] = useState('')
    const [clientId, setClientId] = useState<string | undefined>()
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [isAllDay, setIsAllDay] = useState(false)
    const [notes, setNotes] = useState('')
    const [deposit, setDeposit] = useState<string>('')
    const [transport, setTransport] = useState<string>('')
    const [discount, setDiscount] = useState<string>('')

    // Product State
    const [availableProducts, setAvailableProducts] = useState<Product[]>(initialProducts)
    const [isFetchingAvailability, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState('')
    const [cart, setCart] = useState<CartItems>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch availability when dates change
    useEffect(() => {
        const fetchAvailability = async (start: Date, end: Date) => {
            // Normalize to UTC range to match DB storage
            const utcStart = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0))
            const utcEnd = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59))

            startTransition(async () => {
                const { success, data } = await getProducts({ startDate: utcStart, endDate: utcEnd })
                if (success && data) {
                    setAvailableProducts(data as unknown as Product[])
                }
            })
        }

        if (startDate && endDate) {
            fetchAvailability(startDate, endDate)
        } else if (startDate && isAllDay) {
            fetchAvailability(startDate, startDate)
        } else {
            // Reset to initial if no valid dates (or maybe we want to clear availability?)
            // If no dates, we can't really promise availability.
            // But we can show total stock for reference.
            setAvailableProducts(initialProducts)
        }
    }, [startDate, endDate, isAllDay, initialProducts])

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return availableProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [availableProducts, searchTerm])

    // Cart Logic
    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            const current = prev[productId] || 0
            const next = Math.max(0, current + delta)

            // Check stock limit
            const product = availableProducts.find(p => p.id === productId)
            if (product) {
                // Use availableQuantity if dynamic fetch happened, otherwise fallback to total (but really we should have available)
                // If initialProducts passed, availableQuantity might be undefined, so fallback to total
                // BUT wait, dynamic fetch logic in getProducts NOW returns availableQuantity for static too?
                // No, only if filters passed.
                // If no dates selected, availableQuantity is undefined.
                // If dates selected, it is defined.
                // So: limit = availableQuantity ?? totalQuantity
                const limit = product.availableQuantity !== undefined ? product.availableQuantity : product.totalQuantity

                if (next > limit) {
                    toast.error(`Solo hay ${limit} unidades disponibles para estas fechas`)
                    return prev
                }
            }

            if (next === 0) {
                const { [productId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [productId]: next }
        })
    }

    const handleSetQuantity = (productId: string, value: string) => {
        // Treat empty string as 0
        const qty = value === '' ? 0 : parseInt(value)

        if (isNaN(qty)) return

        setCart(prev => {
            const product = availableProducts.find(p => p.id === productId)

            if (!product) return prev

            // Enforce limits
            const limit = product.availableQuantity !== undefined ? product.availableQuantity : product.totalQuantity

            if (qty > limit) {
                toast.error(`Solo hay ${limit} unidades disponibles para estas fechas`)
                return { ...prev, [productId]: limit }
            }

            if (qty <= 0) {
                const { [productId]: _, ...rest } = prev
                return rest
            }

            return { ...prev, [productId]: qty }
        })
    }

    const handleSubmit = async (shouldPrint: boolean) => {
        // Validation
        if (!name) return toast.error('Ingresa el nombre del evento/cliente')
        if (!startDate) return toast.error('Selecciona la fecha de inicio')

        let finalEndDate = endDate
        if (isAllDay) {
            // If all day, end date is same as start date (logic wise)
            // or we could set it to end of day. For now, same date.
            finalEndDate = startDate
        } else {
            if (!finalEndDate) return toast.error('Selecciona la fecha de fin')
        }

        const items: CreateEventItem[] = Object.entries(cart).map(([id, qty]) => ({
            productId: id,
            quantity: qty
        }))

        if (items.length === 0) return toast.error('Selecciona al menos un producto')

        setIsSubmitting(true)
        try {
            const result = await createEvent({
                name,
                clientId,
                startDate,
                endDate: finalEndDate!,
                notes,
                deposit: deposit ? parseFloat(deposit) : 0,
                transport: transport ? parseFloat(transport) : 0,
                discount: discount ? parseFloat(discount) : 0,
                items,
            })

            if (result.success && result.data) {
                toast.success('Reserva creada exitosamente')
                // Reset
                setName('')
                setClientId(undefined)
                setStartDate(undefined)
                setEndDate(undefined)
                setNotes('')
                setDeposit('')
                setTransport('')
                setDiscount('')
                setCart({})
                router.refresh()
                // Redirect based on user choice
                if (shouldPrint) {
                    router.push(`/events/${result.data.id}?print=true`)
                } else {
                    router.push('/events')
                }
            } else {
                toast.error(result.error || 'Error al crear el evento')
            }
        } catch (error) {
            toast.error('Error procesando la solicitud')
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedCount = Object.keys(cart).length
    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)

    // Calculate cart items with prices
    const cartItems = useMemo(() => {
        return Object.entries(cart).map(([productId, quantity]) => {
            const product = availableProducts.find(p => p.id === productId)
            return {
                product,
                quantity,
                subtotal: (product?.priceUnit || 0) * quantity
            }
        }).filter(item => item.product)
    }, [cart, availableProducts])

    const grandTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.subtotal, 0)
    }, [cartItems])

    return (
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-140px)] gap-4 md:gap-6">
            {/* LEFT COLUMN: Event Details */}
            <div className="w-full md:w-[380px] lg:w-[400px] flex flex-col gap-4 md:overflow-y-auto pr-0 md:pr-2 md:shrink-0">
                <Card className="h-full border-none shadow-none bg-transparent">
                    <CardContent className="p-0 space-y-6">

                        {/* Name / Client Selector */}
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <ClientSelector
                                selectedClient={clientId ? { id: clientId, name: name } : null}
                                onSelect={(client) => {
                                    setClientId(client.id)
                                    setName(client.name)
                                }}
                            />
                        </div>

                        {/* Dates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allDay"
                                    checked={isAllDay}
                                    onChange={(e) => setIsAllDay(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="allDay" className="cursor-pointer font-medium">Evento de todo el día</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>Desde</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "dd/MM/yyyy") : "Fecha Inicio"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {!isAllDay && (
                                    <div className="space-y-2">
                                        <Label>Hasta</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fecha Fin"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notas / Observaciones</Label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Escribe detalles importantes aquí..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Deposit (Optional) */}
                        <div className="space-y-2">
                            <Label>Depósito (Opcional)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="0"
                                    className="pl-9"
                                    value={deposit ? parseInt(deposit).toLocaleString('es-MX') : ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                        setDeposit(val)
                                    }}
                                />
                            </div>
                        </div>

                        {/* Transport (Optional) */}
                        <div className="space-y-2">
                            <Label>Transporte (Opcional)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="0"
                                    className="pl-9"
                                    value={transport ? parseInt(transport).toLocaleString('es-MX') : ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                        setTransport(val)
                                    }}
                                />
                            </div>
                        </div>

                        {/* Discount (Percentage) */}
                        <div className="space-y-2">
                            <Label>Descuento (%)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">%</span>
                                <Input
                                    type="text"
                                    placeholder="0"
                                    className="pl-9"
                                    value={discount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 100)) {
                                            setDiscount(val)
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Preview Section - Only for ADMIN */}
                        {role === 'ADMIN' && cartItems.length > 0 && (
                            <Card className="border-primary/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Resumen de Reserva
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {cartItems.map((item) => (
                                            <div key={item.product!.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                                                <div className="flex-1">
                                                    <div className="font-medium">{item.product!.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.quantity} × ${(item.product!.priceUnit || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="font-semibold">
                                                    ${item.subtotal.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t-2 border-primary/20 space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Subtotal</span>
                                            <span>${grandTotal.toLocaleString()}</span>
                                        </div>
                                        {transport && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Transporte</span>
                                                <span>+${parseInt(transport).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {discount && (
                                            <div className="flex justify-between items-center text-sm text-blue-600 font-medium">
                                                <span>Descuento ({discount}%)</span>
                                                <span>-${((grandTotal + (transport ? parseInt(transport) : 0)) * (parseInt(discount) / 100)).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {deposit && (
                                            <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                                                <span>Depósito</span>
                                                <span>-${parseInt(deposit).toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 font-bold text-lg text-primary">
                                            <span>Total a Pagar</span>
                                            <span>
                                                {(() => {
                                                    const subWithTrans = grandTotal + (transport ? parseInt(transport) : 0);
                                                    const withDiscount = subWithTrans * (1 - (discount ? parseInt(discount) : 0) / 100);
                                                    const finalTotal = withDiscount - (deposit ? parseInt(deposit) : 0);
                                                    return Math.max(0, finalTotal).toLocaleString();
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="pt-4">
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 md:flex-none"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Solo Guardar
                                </Button>
                                <Button
                                    onClick={() => handleSubmit(true)}
                                    disabled={isSubmitting}
                                    className="flex-1 md:flex-none"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Printer className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar e Imprimir
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Product Grid */}
            <div className="flex-1 flex flex-col gap-4 bg-card/50 rounded-xl border p-3 sm:p-4 min-h-[400px] md:min-h-0 md:overflow-hidden">
                {/* Search */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-9 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {isFetchingAvailability && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Actualizando disponibilidad...</div>}

                        {selectedCount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-accent/50 p-2 rounded-lg text-sm text-foreground font-medium w-full sm:w-auto sm:ml-auto gap-1 sm:gap-4">
                                <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> {selectedCount} productos</span>
                                <span className="sm:ml-4">Total unidades: {totalItems}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 pb-4 md:pb-6">
                    {filteredProducts.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            No se encontraron productos
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    quantity={cart[product.id] || 0}
                                    onUpdate={handleUpdateQuantity}
                                    onSet={handleSetQuantity}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ProductCard({
    product,
    quantity,
    onUpdate,
    onSet
}: {
    product: Product,
    quantity: number,
    onUpdate: (id: string, delta: number) => void
    onSet: (id: string, val: string) => void
}) {
    const [inputValue, setInputValue] = useState<string>("")
    const [isFocused, setIsFocused] = useState(false)

    // Sync input value with external quantity when not focused
    useEffect(() => {
        if (!isFocused) {
            setInputValue(quantity === 0 ? "" : quantity.toString())
        }
    }, [quantity, isFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        onSet(product.id, e.target.value)
    }

    const handleFocus = () => {
        setIsFocused(true)
        setInputValue(quantity === 0 ? "" : quantity.toString())
    }

    const handleBlur = () => {
        setIsFocused(false)
        if (inputValue === "" || parseInt(inputValue) === 0) {
            onSet(product.id, "0")
        }
    }

    // Show controls if quantity > 0 OR if we are currently editing (focused)
    const showControls = quantity > 0 || isFocused

    // Determine available stock to display
    // If availableQuantity is defined, use it. Else use total.
    const stockDisplay = product.availableQuantity !== undefined ? product.availableQuantity : product.totalQuantity
    const stockColor = stockDisplay === 0 ? "text-red-500" : "text-muted-foreground"

    return (
        <div
            className={cn(
                "group relative flex flex-col justify-between rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 cursor-pointer",
                showControls ? "border-primary ring-1 ring-primary" : "hover:border-primary/50",
                stockDisplay === 0 && "opacity-60 grayscale"
            )}
            onClick={() => !showControls && stockDisplay > 0 && onUpdate(product.id, 1)}
        >
            {product.imageUrl && (
                <div className="relative w-full aspect-square mb-2 rounded-md overflow-hidden bg-muted" onClick={(e) => e.stopPropagation()}>
                    <ProductDetailsDialog product={product}>
                        <div className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </ProductDetailsDialog>
                </div>
            )}
            <div className="space-y-1">
                <h3 className="font-semibold leading-tight">{product.name}</h3>
                <div className="flex justify-between items-center text-xs">
                    <p className={stockColor}>Disp: {stockDisplay}</p>
                    {product.priceUnit !== undefined && (
                        <p className="font-medium text-muted-foreground">
                            ${product.priceUnit.toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
                {showControls ? (
                    <div className="flex items-center gap-2 bg-background rounded-md border shadow-sm p-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdate(product.id, -1)}>
                            <Minus className="h-3 w-3" />
                        </Button>

                        <input
                            type="number"
                            className="w-12 text-center text-sm font-bold bg-transparent border-none appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none"
                            value={isFocused ? inputValue : quantity}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onClick={(e) => e.stopPropagation()}
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onUpdate(product.id, 1)}
                            disabled={quantity >= stockDisplay}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={stockDisplay === 0}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
