'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, Image as ImageIcon, Eye } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/inventory/image-upload'

type SeccionTipo = 'hero' | 'galeria' | 'nosotros' | 'servicios' | 'contacto' | 'general'

type Seccion = {
    id: string
    tipo: SeccionTipo
    titulo: string
    subtitulo: string
    descripcion: string
    imageUrl: string
    orden: number
    activo: boolean
}

const TIPOS: { value: SeccionTipo; label: string }[] = [
    { value: 'hero', label: 'Hero / Portada' },
    { value: 'galeria', label: 'Galería' },
    { value: 'nosotros', label: 'Nosotros / About' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'contacto', label: 'Contacto' },
    { value: 'general', label: 'General' },
]

const emptyForm: Omit<Seccion, 'id'> = {
    tipo: 'general',
    titulo: '',
    subtitulo: '',
    descripcion: '',
    imageUrl: '',
    orden: 0,
    activo: true,
}

export function ContenidoManager() {
    const [secciones, setSecciones] = useState<Seccion[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [openPreview, setOpenPreview] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<Omit<Seccion, 'id'>>({ ...emptyForm })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [previewItem, setPreviewItem] = useState<Seccion | null>(null)

    const fetchSecciones = useCallback(async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const res = await fetch('/api/admin/contenido')
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const data = await res.json()
            setSecciones(Array.isArray(data) ? data : [])
        } catch {
            setFetchError('No se pudo conectar al servidor. Verifica que el backend esté corriendo en localhost:3001.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSecciones()
    }, [fetchSecciones])

    const handleCreate = async () => {
        if (!form.titulo) {
            toast.error('El título es obligatorio')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/contenido', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al crear sección')
            }
            toast.success('Sección creada correctamente')
            setOpenCreate(false)
            setForm({ ...emptyForm })
            fetchSecciones()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al crear sección')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (s: Seccion) => {
        setEditingId(s.id)
        const { id: _id, ...rest } = s
        setForm(rest)
        setOpenEdit(true)
    }

    const handleUpdate = async () => {
        if (!editingId) return
        if (!form.titulo) {
            toast.error('El título es obligatorio')
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/contenido/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al actualizar sección')
            }
            toast.success('Sección actualizada correctamente')
            setOpenEdit(false)
            setEditingId(null)
            setForm({ ...emptyForm })
            fetchSecciones()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar sección')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, titulo: string) => {
        if (!confirm(`¿Eliminar la sección "${titulo}"?`)) return
        try {
            const res = await fetch(`/api/admin/contenido/${id}`, { method: 'DELETE' })
            if (!res.ok && res.status !== 204) {
                const err = await res.json()
                throw new Error(err.message || 'Error al eliminar sección')
            }
            toast.success('Sección eliminada')
            fetchSecciones()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar sección')
        }
    }

    const handlePreview = (s: Seccion) => {
        setPreviewItem(s)
        setOpenPreview(true)
    }

    const tipoLabel = (tipo: string) => TIPOS.find((t) => t.value === tipo)?.label ?? tipo

    const SeccionForm = () => (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Tipo</Label>
                <Select
                    value={form.tipo}
                    onValueChange={(val) => setForm({ ...form, tipo: val as SeccionTipo })}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TIPOS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                                {t.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Título *</Label>
                <Input
                    className="col-span-3"
                    placeholder="Título de la sección"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Subtítulo</Label>
                <Input
                    className="col-span-3"
                    placeholder="Subtítulo o tagline"
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-xs pt-2">Descripción</Label>
                <Textarea
                    className="col-span-3 min-h-[80px]"
                    placeholder="Texto descriptivo de la sección..."
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-xs pt-2">Imagen</Label>
                <div className="col-span-3">
                    <ImageUpload
                        value={form.imageUrl}
                        onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
                        folderPath="web"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Orden</Label>
                <Input
                    type="number"
                    className="col-span-3"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                    min={0}
                />
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
                <Button variant="outline" size="sm" onClick={fetchSecciones} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>

                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Sección
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Crear Sección de Contenido</DialogTitle>
                        </DialogHeader>
                        <SeccionForm />
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={saving} className="w-full sm:w-auto">
                                {saving ? 'Guardando...' : 'Crear Sección'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Sección</DialogTitle>
                    </DialogHeader>
                    <SeccionForm />
                    <DialogFooter>
                        <Button onClick={handleUpdate} disabled={saving} className="w-full sm:w-auto">
                            {saving ? 'Guardando...' : 'Actualizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Vista previa: {previewItem?.titulo}</DialogTitle>
                    </DialogHeader>
                    {previewItem && (
                        <div className="space-y-3 py-2">
                            {previewItem.imageUrl && (
                                <img
                                    src={previewItem.imageUrl}
                                    alt={previewItem.titulo}
                                    className="w-full h-40 rounded-lg object-cover"
                                />
                            )}
                            <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {tipoLabel(previewItem.tipo)}
                                </span>
                                <h3 className="text-lg font-bold mt-1">{previewItem.titulo}</h3>
                                {previewItem.subtitulo && (
                                    <p className="text-sm text-muted-foreground">{previewItem.subtitulo}</p>
                                )}
                                {previewItem.descripcion && (
                                    <p className="text-sm mt-2 leading-relaxed">{previewItem.descripcion}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Orden: {previewItem.orden}</span>
                                <span className={previewItem.activo ? 'text-green-600' : 'text-red-500'}>
                                    {previewItem.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    )}
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
                    Cargando contenido...
                </div>
            )}

            {!loading && !fetchError && secciones.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No hay secciones de contenido.</p>
                    <p className="text-xs mt-1">Crea una con el botón de arriba.</p>
                </div>
            )}

            {/* Cards Grid */}
            {!loading && secciones.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {secciones
                        .sort((a, b) => a.orden - b.orden)
                        .map((s) => (
                            <div key={s.id} className="border rounded-lg overflow-hidden bg-card">
                                {s.imageUrl ? (
                                    <img
                                        src={s.imageUrl}
                                        alt={s.titulo}
                                        className="w-full h-32 object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                ) : (
                                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground opacity-40" />
                                    </div>
                                )}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                {tipoLabel(s.tipo)} · #{s.orden}
                                            </span>
                                            <h4 className="font-semibold text-sm truncate">{s.titulo}</h4>
                                            {s.subtitulo && (
                                                <p className="text-xs text-muted-foreground truncate">{s.subtitulo}</p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${s.activo
                                            ? 'bg-green-50 text-green-700 ring-green-700/10'
                                            : 'bg-red-50 text-red-700 ring-red-700/10'
                                            }`}>
                                            {s.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    {s.descripcion && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{s.descripcion}</p>
                                    )}
                                    <div className="flex justify-end gap-1 pt-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(s)}>
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(s)}>
                                            <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(s.id, s.titulo)}>
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}
