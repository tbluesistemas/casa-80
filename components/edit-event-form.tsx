'use client'

import { useState, useMemo } from 'react'
import { updateEvent } from '@/lib/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, Trash2, Printer, Save } from 'lucide-react'

type EditableQuantity = number | ''
type EditableEventItem = {
    productId: string
    quantity: EditableQuantity
    productName: string
    priceUnit: number
}

interface EditEventFormProps {
    event: {
        id: string
        name: string
        startDate: Date
        endDate: Date
        status: string
        notes?: string | null
        deposit: number
        iva: number
        transport: number
        discount: number
        items: {
            productId: string
            quantity: number
            product: {
                name: string
                totalQuantity: number
                priceUnit: number
            }
        }[]
    }
    allProducts: {
        id: string
        name: string
        totalQuantity: number
        priceUnit: number
    }[]
}

export function EditEventForm({ event, allProducts }: EditEventFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: event.name,
        startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(event.endDate), 'yyyy-MM-dd'),
        status: event.status,
        notes: event.notes || '',
        deposit: event.deposit?.toString() || '',
        iva: event.iva?.toString() || '',
        transport: event.transport?.toString() || '',
        discount: event.discount?.toString() || '',
    })

    // State for items
    const [items, setItems] = useState<EditableEventItem[]>(
        event.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            productName: item.product.name,
            priceUnit: item.product.priceUnit
        }))
    )

    // State for new item selection
    const [selectedProductId, setSelectedProductId] = useState<string>("")

    const totalCost = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + ((Number(item.quantity) || 0) * item.priceUnit), 0)
        const subWithTrans = subtotal + (formData.transport ? parseFloat(formData.transport) : 0)
        const withDiscount = subWithTrans * (1 - (formData.discount ? parseFloat(formData.discount) : 0) / 100)
        const ivaAmount = withDiscount * ((formData.iva ? parseFloat(formData.iva) : 0) / 100)
        return withDiscount + ivaAmount
    }, [items, formData.iva, formData.transport, formData.discount])

    const handleSubmit = async (shouldPrint: boolean = false) => {
        setLoading(true)

        const validItems = items.filter(i => Number(i.quantity) > 0).map(i => ({
            productId: i.productId,
            quantity: Number(i.quantity)
        }))

        const result = await updateEvent(event.id, {
            name: formData.name,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            status: formData.status,
            notes: formData.notes || undefined,
            deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
            iva: formData.iva ? parseFloat(formData.iva) : 0,
            transport: formData.transport ? parseFloat(formData.transport) : 0,
            discount: formData.discount ? parseFloat(formData.discount) : 0,
            items: validItems
        })

        if (result.success) {
            toast.success('Reserva actualizada correctamente')
            if (shouldPrint) {
                router.push(`/events/${event.id}?print=true`)
            } else {
                router.push('/events')
            }
        } else {
            toast.error(result.error)
        }
        setLoading(false)
    }

    const handleQuantityChange = (productId: string, newQuantity: string) => {
        const sanitized = newQuantity.replace(/[^0-9]/g, '')
        const qty: EditableQuantity = sanitized === '' ? '' : parseInt(sanitized)

        setItems(items.map(item =>
            item.productId === productId ? { ...item, quantity: qty } : item
        ))
    }

    const handleQuantityBlur = (productId: string) => {
        setItems(items.map(item =>
            item.productId === productId && item.quantity === ''
                ? { ...item, quantity: 1 }
                : item
        ))
    }

    const handleAddItem = () => {
        if (!selectedProductId) return

        const product = allProducts.find(p => p.id === selectedProductId)
        if (!product) return

        if (items.some(i => i.productId === selectedProductId)) {
            toast.error("El producto ya está en la lista")
            return
        }

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            priceUnit: product.priceUnit
        }])
        setSelectedProductId("")
    }

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(i => i.productId !== productId))
    }

    const isEditable = ['SIN_CONFIRMAR', 'RESERVADO', 'DESPACHADO'].includes(event.status)

    const availableProducts = allProducts.filter(p => !items.some(i => i.productId === p.id))

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información de la Reserva</CardTitle>
            </CardHeader>
            <form>
                <CardContent className="space-y-4 px-4 md:px-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Evento *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">Fecha de Inicio *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">Fecha de Fin *</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-medium">Artículos Reservados</h3>
                            <p className="text-sm text-gray-500">
                                {isEditable
                                    ? "Gestiona los artículos de la reserva."
                                    : "No se pueden modificar artículos en este estado."}
                            </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                            <div className="text-xs sm:text-sm text-gray-500">Total Estimado</div>
                            <div className="text-xl sm:text-2xl font-bold text-primary">
                                ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {isEditable && (
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border p-4 rounded-md bg-muted/20">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="addProduct text-xs">Agregar Producto</Label>
                                <Select
                                    value={selectedProductId}
                                    onValueChange={setSelectedProductId}
                                    disabled={availableProducts.length === 0}
                                >
                                    <SelectTrigger id="addProduct">
                                        <SelectValue placeholder={
                                            availableProducts.length === 0
                                                ? "Todos los productos agregados"
                                                : "Seleccionar..."
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProducts.map(product => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} - ${product.priceUnit} (Stock: {product.totalQuantity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" onClick={handleAddItem} disabled={!selectedProductId} className="w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Agregar
                            </Button>
                        </div>
                    )}

                    <div className="space-y-3 mt-4">
                        {items.length === 0 && (
                            <div className="text-center p-8 border border-dashed rounded text-gray-400">
                                No hay artículos seleccionados
                            </div>
                        )}
                        {items.map((item) => (
                            <div key={item.productId} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border p-3 rounded-md bg-card gap-3">
                                <div className="min-w-0">
                                    <div className="font-medium truncate" title={item.productName}>{item.productName}</div>
                                    <div className="text-xs text-gray-500">Unit: ${item.priceUnit}</div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3">
                                    <div className="text-right w-auto sm:w-24 shrink-0">
                                        <div className="font-semibold text-sm">
                                            ${((Number(item.quantity) || 0) * item.priceUnit).toLocaleString('es-MX')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`qty-${item.productId}`} className="sr-only">Cant.</Label>
                                        <Input
                                            id={`qty-${item.productId}`}
                                            type="text"
                                            inputMode="numeric"
                                            className="w-16 sm:w-20 h-8 sm:h-10 text-right"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                            onBlur={() => handleQuantityBlur(item.productId)}
                                            disabled={!isEditable}
                                        />
                                        {isEditable && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 sm:h-10 sm:w-10 text-destructive hover:text-destructive/90"
                                                onClick={() => handleRemoveItem(item.productId)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-2 pt-4">
                        <Label htmlFor="status">Estado</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SIN_CONFIRMAR">Sin Confirmar</SelectItem>
                                <SelectItem value="RESERVADO">Reservado</SelectItem>
                                <SelectItem value="DESPACHADO">Despachado</SelectItem>
                                <SelectItem value="COMPLETADO">Completado</SelectItem>
                                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="deposit">Depósito</Label>
                            <Input
                                id="deposit"
                                type="text"
                                value={formData.deposit}
                                onChange={(e) => setFormData({ ...formData, deposit: e.target.value.replace(/[^0-9.]/g, '') })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="iva">IVA (%)</Label>
                            <Input
                                id="iva"
                                type="text"
                                value={formData.iva}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '')
                                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                        setFormData({ ...formData, iva: val })
                                    }
                                }}
                                placeholder="0"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transport">Transporte</Label>
                            <Input
                                id="transport"
                                type="text"
                                value={formData.transport}
                                onChange={(e) => setFormData({ ...formData, transport: e.target.value.replace(/[^0-9.]/g, '') })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discount">Descuento (%)</Label>
                            <Input
                                id="discount"
                                type="text"
                                value={formData.discount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '')
                                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                        setFormData({ ...formData, discount: val })
                                    }
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={4}
                            placeholder="Notas adicionales..."
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push('/events')} className="w-full sm:w-auto order-2 sm:order-1">
                        Cancelar
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                        <Button type="button" variant="outline" disabled={loading} onClick={() => handleSubmit(false)} className="w-full sm:w-auto">
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? 'Guardando...' : 'Solo Guardar'}
                        </Button>
                        <Button type="button" disabled={loading} onClick={() => handleSubmit(true)} className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" />
                            {loading ? 'Guardando...' : 'Guardar e Imprimir'}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
