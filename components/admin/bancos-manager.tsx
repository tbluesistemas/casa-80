'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

type Banco = {
    id: string
    nombre: string
    color: string
    titular: string
    numeroCuenta: string
    cci: string
    qrImageUrl: string
    activo: boolean
}

const emptyForm: Omit<Banco, 'activo'> & { activo: boolean } = {
    id: '',
    nombre: '',
    color: '#000000',
    titular: '',
    numeroCuenta: '',
    cci: '',
    qrImageUrl: '',
    activo: true,
}

export function BancosManager() {
    const [bancos, setBancos] = useState<Banco[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ ...emptyForm })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [previewQR, setPreviewQR] = useState(false)

    const fetchBancos = useCallback(async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const res = await fetch('/api/admin/bancos')
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const data = await res.json()
            setBancos(Array.isArray(data) ? data : [])
        } catch {
            setFetchError('No se pudo conectar al servidor. Verifica que el backend esté corriendo en localhost:3001.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBancos()
    }, [fetchBancos])

    const handleCreate = async () => {
        if (!form.id || !form.nombre || !form.titular || !form.numeroCuenta) {
            toast.error('ID, nombre, titular y número de cuenta son obligatorios')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/bancos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al crear banco')
            }
            toast.success('Banco creado correctamente')
            setOpenCreate(false)
            setForm({ ...emptyForm })
            fetchBancos()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al crear banco')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (banco: Banco) => {
        setEditingId(banco.id)
        setForm({ ...banco })
        setOpenEdit(true)
    }

    const handleUpdate = async () => {
        if (!editingId) return
        if (!form.nombre || !form.titular || !form.numeroCuenta) {
            toast.error('Nombre, titular y número de cuenta son obligatorios')
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/bancos/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al actualizar banco')
            }
            toast.success('Banco actualizado correctamente')
            setOpenEdit(false)
            setEditingId(null)
            setForm({ ...emptyForm })
            fetchBancos()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar banco')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Eliminar el banco "${nombre}"?`)) return
        try {
            const res = await fetch(`/api/admin/bancos/${id}`, { method: 'DELETE' })
            if (!res.ok && res.status !== 204) {
                const err = await res.json()
                throw new Error(err.message || 'Error al eliminar banco')
            }
            toast.success('Banco eliminado')
            fetchBancos()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar banco')
        }
    }

    const BancoForm = ({ isEdit = false }: { isEdit?: boolean }) => (
        <div className="grid gap-4 py-4">
            {!isEdit && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs">ID</Label>
                    <div className="col-span-3 space-y-1">
                        <Input
                            placeholder="ej: scotiabank"
                            value={form.id}
                            onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        />
                        <p className="text-[10px] text-muted-foreground">Identificador único (sin espacios)</p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Nombre</Label>
                <Input
                    className="col-span-3"
                    placeholder="ej: Scotiabank"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Color</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded border p-0.5"
                    />
                    <Input
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                        placeholder="#000000"
                        className="flex-1"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Titular</Label>
                <Input
                    className="col-span-3"
                    placeholder="ej: Casa80 Alquiler S.A.C."
                    value={form.titular}
                    onChange={(e) => setForm({ ...form, titular: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">N° Cuenta</Label>
                <Input
                    className="col-span-3"
                    placeholder="000-1234567"
                    value={form.numeroCuenta}
                    onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">CCI</Label>
                <Input
                    className="col-span-3"
                    placeholder="009..."
                    value={form.cci}
                    onChange={(e) => setForm({ ...form, cci: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-xs pt-2">URL QR</Label>
                <div className="col-span-3 space-y-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://..."
                            value={form.qrImageUrl}
                            onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })}
                        />
                        {form.qrImageUrl && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setPreviewQR(!previewQR)}
                            >
                                {previewQR ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                    {previewQR && form.qrImageUrl && (
                        <img
                            src={form.qrImageUrl}
                            alt="QR Preview"
                            className="h-24 w-24 rounded border object-contain"
                            onError={() => toast.error('No se pudo cargar la imagen QR')}
                        />
                    )}
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Activo</Label>
                <Switch
                    checked={form.activo}
                    onCheckedChange={(val) => setForm({ ...form, activo: val })}
                />
            </div>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={fetchBancos} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Banco
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Nuevo Método de Pago</DialogTitle>
                        </DialogHeader>
                        <BancoForm />
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={saving} className="w-full sm:w-auto">
                                {saving ? 'Guardando...' : 'Crear Banco'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Banco</DialogTitle>
                    </DialogHeader>
                    <BancoForm isEdit />
                    <DialogFooter>
                        <Button onClick={handleUpdate} disabled={saving} className="w-full sm:w-auto">
                            {saving ? 'Guardando...' : 'Actualizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {fetchError && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {fetchError}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cargando bancos...
                </div>
            )}

            {!loading && !fetchError && bancos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <p className="text-sm">No hay bancos registrados.</p>
                    <p className="text-xs mt-1">Agrega uno con el botón de arriba.</p>
                </div>
            )}

            {/* Mobile Cards */}
            {!loading && bancos.length > 0 && (
                <div className="md:hidden space-y-3">
                    {bancos.map((banco) => (
                        <div key={banco.id} className="border rounded-lg p-4 bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-5 w-5 rounded-full border shrink-0"
                                        style={{ backgroundColor: banco.color }}
                                    />
                                    <div>
                                        <div className="font-semibold text-sm">{banco.nombre}</div>
                                        <div className="text-xs text-muted-foreground">{banco.titular}</div>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${banco.activo
                                    ? 'bg-green-50 text-green-700 ring-green-700/10'
                                    : 'bg-red-50 text-red-700 ring-red-700/10'
                                    }`}>
                                    {banco.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>Cuenta: {banco.numeroCuenta}</div>
                                {banco.cci && <div>CCI: {banco.cci}</div>}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(banco)}>
                                    <Pencil className="h-3.5 w-3.5 mr-1 text-blue-500" /> Editar
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(banco.id, banco.nombre)}>
                                    <Trash2 className="h-3.5 w-3.5 mr-1 text-red-500" /> Borrar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Desktop Table */}
            {!loading && bancos.length > 0 && (
                <div className="hidden md:block rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Banco</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>N° Cuenta</TableHead>
                                <TableHead>CCI</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bancos.map((banco) => (
                                <TableRow key={banco.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-4 w-4 rounded-full border shrink-0"
                                                style={{ backgroundColor: banco.color }}
                                            />
                                            <span className="font-medium">{banco.nombre}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{banco.titular}</TableCell>
                                    <TableCell className="font-mono text-sm">{banco.numeroCuenta}</TableCell>
                                    <TableCell className="font-mono text-sm">{banco.cci || '—'}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${banco.activo
                                            ? 'bg-green-50 text-green-700 ring-green-700/10'
                                            : 'bg-red-50 text-red-700 ring-red-700/10'
                                            }`}>
                                            {banco.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(banco)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(banco.id, banco.nombre)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
