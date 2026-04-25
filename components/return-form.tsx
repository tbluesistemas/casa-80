'use client'

import { useState } from 'react'
import { registerReturn, ReturnItem } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type EventWithItems = {
    id: string
    name: string
    status: string
    deposit: number
    damageDepositApplied: number
    items: {
        productId: string
        quantity: number
        returnedGood: number
        returnedDamaged: number
        product: {
            name: string
            priceReplacement: number
        }
    }[]
}

export function ReturnForm({ event }: { event: EventWithItems }) {
    const router = useRouter()
    const isEditing = event.status === 'COMPLETADO'

    const [items, setItems] = useState<ReturnItem[]>(
        event.items.map(item => ({
            productId: item.productId,
            returnedGood: isEditing ? item.returnedGood : item.quantity,
            returnedDamaged: isEditing ? item.returnedDamaged : 0,
        }))
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [damageDepositApplied, setDamageDepositApplied] = useState(
        event.damageDepositApplied ? Math.round(event.damageDepositApplied).toString() : ''
    )
    const [returnNote, setReturnNote] = useState('')

    const handleChange = (index: number, field: 'returnedGood' | 'returnedDamaged', value: string) => {
        const val = value === '' ? 0 : parseInt(value) || 0
        const newItems = [...items]
        newItems[index][field] = val
        setItems(newItems)
    }

    const totalDamage = items.reduce((sum, item) => {
        const product = event.items.find(i => i.productId === item.productId)?.product
        return sum + (item.returnedDamaged * (product?.priceReplacement || 0))
    }, 0)

    const maxDepositApplicable = Math.max(0, event.deposit || 0)
    const parsedDamageDepositApplied = damageDepositApplied ? parseInt(damageDepositApplied) || 0 : 0
    const depositRetention = Math.min(Math.max(totalDamage, parsedDamageDepositApplied), maxDepositApplicable)
    const remainingDamage = Math.max(0, totalDamage - depositRetention)
    const depositToReturn = Math.max(0, (event.deposit || 0) - depositRetention)

    const handleDamageDepositChange = (value: string) => {
        const rawValue = value.replace(/[^0-9]/g, '')

        if (rawValue === '') {
            setDamageDepositApplied('')
            return
        }

        const nextValue = Math.min(parseInt(rawValue) || 0, maxDepositApplicable)
        setDamageDepositApplied(nextValue.toString())
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const result = await registerReturn(event.id, items, depositRetention, returnNote)
            if (result.success) {
                const cost = result.data?.totalDamageCost || 0
                const remaining = result.data?.remainingDamageCost || 0
                if (cost > 0 || depositRetention > 0) {
                    toast.warning(`Devolucion registrada. Danos en productos: $${cost.toLocaleString()}. Deposito retenido: $${depositRetention.toLocaleString()}. Saldo por pagar: $${remaining.toLocaleString()}`)
                } else {
                    toast.success('Devolucion registrada sin danos.')
                }
                router.push('/events')
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Error al procesar devolucion')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-base md:text-lg">Items del Evento: {event.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
                <div className="md:hidden divide-y">
                    {event.items.map((originalItem, index) => (
                        <div key={originalItem.productId} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="font-medium text-sm">{originalItem.product.name}</div>
                                <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    Entregado: {originalItem.quantity}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Devuelto (OK)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="text-center h-9"
                                        value={items[index].returnedGood === 0 ? '' : items[index].returnedGood}
                                        onChange={(e) => handleChange(index, 'returnedGood', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-destructive">Danado</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="text-center h-9 border-red-200 focus-visible:ring-red-500"
                                        value={items[index].returnedDamaged === 0 ? '' : items[index].returnedDamaged}
                                        onChange={(e) => handleChange(index, 'returnedDamaged', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-muted-foreground italic">Valor dano unitario:</span>
                                <span className="text-red-600 font-bold">${originalItem.product.priceReplacement.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Entregado</TableHead>
                                <TableHead className="w-32 text-center">Devuelto (Bien)</TableHead>
                                <TableHead className="w-32 text-center">Danado</TableHead>
                                <TableHead className="text-right">Valor dano (Unit)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.items.map((originalItem, index) => (
                                <TableRow key={originalItem.productId}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{originalItem.product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{originalItem.quantity}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            className="text-center"
                                            value={items[index].returnedGood === 0 ? '' : items[index].returnedGood}
                                            onChange={(e) => handleChange(index, 'returnedGood', e.target.value)}
                                            placeholder="0"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            className="text-center border-red-200 focus-visible:ring-red-500"
                                            value={items[index].returnedDamaged === 0 ? '' : items[index].returnedDamaged}
                                            onChange={(e) => handleChange(index, 'returnedDamaged', e.target.value)}
                                            placeholder="0"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">
                                        ${originalItem.product.priceReplacement.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {(totalDamage > 0 || event.deposit > 0) && (
                    <div className="p-4 md:p-0 md:mt-6 flex justify-end">
                        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-red-600">
                                        Total por danos en productos
                                    </span>
                                    <span className="text-2xl font-bold text-red-700">
                                        ${totalDamage.toLocaleString()}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Retener del deposito por danos
                                    </label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        className="text-right font-semibold"
                                        value={depositRetention === 0 ? '' : depositRetention.toLocaleString('es-CO')}
                                        onChange={(e) => handleDamageDepositChange(e.target.value)}
                                        placeholder="$0"
                                        disabled={maxDepositApplicable <= 0}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Deposito disponible: ${event.deposit.toLocaleString()} | Se calcula con base en el valor que hay que pagar.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm border">
                                <span className="font-semibold text-slate-700">Saldo a pagar por danos de productos</span>
                                <span className="text-xl font-bold text-red-700">${remainingDamage.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3 text-sm border border-teal-100">
                                <span className="font-semibold text-teal-800">Deposito a devolver</span>
                                <span className="text-xl font-bold text-teal-700">${depositToReturn.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 md:px-0 md:pt-6">
                    <div className="rounded-2xl border bg-slate-50/60 p-4">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Nota o novedad de la devolucion
                        </label>
                        <Textarea
                            className="mt-2 min-h-24 bg-white"
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                            placeholder="Ejemplo: el mobiliario llego mojado, con rayones, incompleto o requiere revision adicional."
                            maxLength={500}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Esta nota quedara guardada en el historial de la reserva.
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="px-4 md:px-6 pb-6">
                <Button className="w-full h-11 md:h-10 text-base md:text-sm" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Procesando...' : 'Finalizar Devolucion'}
                </Button>
            </CardFooter>
        </Card>
    )
}
