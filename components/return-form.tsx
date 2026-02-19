'use client'

import { useState } from 'react'
import { registerReturn, ReturnItem } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type EventWithItems = {
    id: string
    name: string
    status: string
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

    // Determine if we are editing an existing return or starting a new one
    // If status is COMPLETADO, we assume we are editing -> load values from DB
    // If not, we assume new return -> default to all good
    const isEditing = event.status === 'COMPLETADO'

    const [items, setItems] = useState<ReturnItem[]>(
        event.items.map(item => ({
            productId: item.productId,
            returnedGood: isEditing ? item.returnedGood : item.quantity,
            returnedDamaged: isEditing ? item.returnedDamaged : 0
        }))
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (index: number, field: 'returnedGood' | 'returnedDamaged', value: string) => {
        const val = value === '' ? 0 : parseInt(value) || 0
        const newItems = [...items]
        newItems[index][field] = val
        setItems(newItems)
    }

    // Calculate total damage cost live
    const totalDamage = items.reduce((sum, item, idx) => {
        const product = event.items.find(i => i.productId === item.productId)?.product
        return sum + (item.returnedDamaged * (product?.priceReplacement || 0))
    }, 0)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const result = await registerReturn(event.id, items)
            if (result.success) {
                const cost = result.data?.totalDamageCost || 0
                if (cost > 0) {
                    toast.warning(`Devolución registrada. Costo de daños: $${cost.toFixed(2)}`)
                } else {
                    toast.success('Devolución registrada sin daños.')
                }
                router.push('/events')
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error('Error al procesar devolución')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Items del Evento: {event.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Entregado</TableHead>
                            <TableHead className="w-32 text-center">Devuelto (Bien)</TableHead>
                            <TableHead className="w-32 text-center">Dañado</TableHead>
                            <TableHead className="text-right">Valor Daño (Unit)</TableHead>
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

                {totalDamage > 0 && (
                    <div className="mt-6 flex justify-end">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-right">
                            <span className="text-sm text-red-600 uppercase font-semibold block">Total a Pagar por Daños</span>
                            <span className="text-2xl font-bold text-red-700">${totalDamage.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Procesando...' : 'Finalizar Devolución'}
                </Button>
            </CardFooter>
        </Card>
    )
}
