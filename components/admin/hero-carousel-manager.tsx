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
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/inventory/image-upload'

type HeroImage = {
    id: string
    imageUrl: string
    alt: string
    orden: number
    activo: boolean
}

const emptyForm: Omit<HeroImage, 'id'> = {
    imageUrl: '',
    alt: '',
    orden: 0,
    activo: true,
}

export function HeroCarouselManager() {
    const [images, setImages] = useState<HeroImage[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<Omit<HeroImage, 'id'>>({ ...emptyForm })
    const [editingId, setEditingId] = useState<string | null>(null)

    const fetchImages = useCallback(async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const res = await fetch('/api/admin/hero-carousel')
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const data = await res.json()
            setImages(Array.isArray(data) ? data : [])
        } catch {
            setFetchError('No se pudo conectar al servidor.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchImages()
    }, [fetchImages])

    const handleCreate = async () => {
        if (!form.imageUrl) {
            toast.error('La URL de la imagen es obligatoria')
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/hero-carousel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al agregar imagen')
            }
            toast.success('Imagen agregada correctamente')
            setOpenCreate(false)
            setForm({ ...emptyForm })
            fetchImages()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al agregar imagen')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (img: HeroImage) => {
        setEditingId(img.id)
        const { id: _id, ...rest } = img
        setForm(rest)
        setOpenEdit(true)
    }

    const handleUpdate = async () => {
        if (!editingId) return
        if (!form.imageUrl) {
            toast.error('La URL de la imagen es obligatoria')
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/hero-carousel/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Error al actualizar imagen')
            }
            toast.success('Imagen actualizada correctamente')
            setOpenEdit(false)
            setEditingId(null)
            setForm({ ...emptyForm })
            fetchImages()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar imagen')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(`¿Eliminar esta imagen del carrusel?`)) return
        try {
            const res = await fetch(`/api/admin/hero-carousel/${id}`, { method: 'DELETE' })
            if (!res.ok && res.status !== 204) {
                const err = await res.json()
                throw new Error(err.message || 'Error al eliminar imagen')
            }
            toast.success('Imagen eliminada')
            fetchImages()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar imagen')
        }
    }

    const ImageForm = () => (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-xs pt-2">Imagen *</Label>
                <div className="col-span-3">
                    <ImageUpload
                        value={form.imageUrl}
                        onChange={(url) => setForm({ ...form, imageUrl: url || '' })}
                        folderPath="hero"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs">Texto Alternativo (Alt)</Label>
                <Input
                    className="col-span-3"
                    placeholder="Ej: Evento Corporativo"
                    value={form.alt}
                    onChange={(e) => setForm({ ...form, alt: e.target.value })}
                />
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
                <h4 className="text-base font-medium">Imágenes del Carrusel</h4>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchImages} disabled={loading}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>

                    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Imagen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-lg rounded-lg">
                            <DialogHeader>
                                <DialogTitle>Agregar Imagen al Carrusel</DialogTitle>
                            </DialogHeader>
                            <ImageForm />
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={saving} className="w-full sm:w-auto">
                                    {saving ? 'Guardando...' : 'Agregar Imagen'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Imagen</DialogTitle>
                    </DialogHeader>
                    <ImageForm />
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

            {!loading && !fetchError && images.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border rounded-lg bg-card">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No hay imágenes configuradas.</p>
                </div>
            )}

            {!loading && images.length > 0 && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {images
                        .sort((a, b) => a.orden - b.orden)
                        .map((img) => (
                            <div key={img.id} className="border rounded-lg overflow-hidden bg-card relative group">
                                <img
                                    src={img.imageUrl}
                                    alt={img.alt || 'Carrusel imagen'}
                                    className={`w-full h-32 object-cover ${!img.activo ? 'opacity-50 grayscale' : ''}`}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white`}>
                                        #{img.orden}
                                    </span>
                                </div>
                                <div className="p-2 space-y-1">
                                    <p className="text-xs text-muted-foreground truncate">{img.alt || 'Sin texto alternativo'}</p>
                                    
                                    <div className="flex justify-end gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleEdit(img)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(img.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
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
