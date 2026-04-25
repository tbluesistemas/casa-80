'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { History, Loader2 } from "lucide-react"
import { getInventoryLogs } from "@/lib/actions"
import { format } from "date-fns"

interface HistoryDialogProps {
    productId: string
    productName: string
}

export function HistoryDialog({ productId, productName }: HistoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleOpen = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            setLoading(true)
            const res = await getInventoryLogs(productId)
            if (res.success && res.data) {
                setLogs(res.data)
            }
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver Historial">
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Historial: {productName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">No hay historial registrado.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-2">Fecha</th>
                                    <th className="py-2">Tipo</th>
                                    <th className="py-2 text-right">Cambio</th>
                                    <th className="py-2 text-right">Total</th>
                                    <th className="py-2">Recibido Por</th>
                                    <th className="py-2">Verificado Por</th>
                                    <th className="py-2">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="py-2">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</td>
                                        <td className="py-2 badge">{log.type}</td>
                                        <td className={`py-2 text-right font-bold ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.change > 0 ? '+' : ''}{log.change}
                                        </td>
                                        <td className="py-2 text-right">{log.newTotal}</td>
                                        <td className="py-2">{log.receivedBy || '-'}</td>
                                        <td className="py-2">{log.verifiedBy || '-'}</td>
                                        <td className="py-2 text-muted-foreground">{log.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
