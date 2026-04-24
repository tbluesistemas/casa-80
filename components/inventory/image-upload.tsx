'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, UploadCloud, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

import { Progress } from '@/components/ui/progress'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface ImageUploadProps {
    value?: string | null
    values?: string[]
    onChange?: (url: string | null) => void
    onMultipleChange?: (urls: string[]) => void
    multiple?: boolean
    maxFiles?: number
    disabled?: boolean
    bucket?: string
    folderPath?: string
}

export function ImageUpload({
    value,
    values,
    onChange,
    onMultipleChange,
    multiple = false,
    maxFiles = 8,
    disabled,
    bucket = 'product-images',
    folderPath = 'products'
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageValues = multiple ? values ?? [] : value ? [value] : []
    const isAtLimit = multiple && imageValues.length >= maxFiles

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new window.Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob)
                            else reject(new Error('Canvas to Blob failed'))
                        },
                        'image/webp',
                        0.7
                    )
                }
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const emitChange = (nextValues: string[]) => {
        if (multiple) {
            onMultipleChange?.(nextValues)
            return
        }

        onChange?.(nextValues[0] ?? null)
    }

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!supabaseUrl || !supabaseAnonKey) {
                toast.error('Error de configuración: faltan las credenciales de Supabase en el archivo .env')
                return
            }

            const selectedFiles = Array.from(e.target.files ?? [])
            if (selectedFiles.length === 0) return

            const files = multiple
                ? selectedFiles.slice(0, Math.max(0, maxFiles - imageValues.length))
                : selectedFiles.slice(0, 1)

            if (files.length === 0) {
                toast.error(`Solo puedes subir hasta ${maxFiles} imágenes`)
                return
            }

            setUploading(true)
            setProgress(5)

            const supabase = createClient(supabaseUrl, supabaseAnonKey)
            const uploadedUrls: string[] = []

            for (const [index, file] of files.entries()) {
                const startProgress = Math.round((index / files.length) * 90)
                const endProgress = Math.round(((index + 1) / files.length) * 90)

                const compressedBlob = await compressImage(file)
                setProgress(Math.max(10, startProgress + 10))

                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}-${index}.webp`
                const filePath = `${folderPath}/${fileName}`

                const { error } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, compressedBlob, {
                        contentType: 'image/webp',
                        cacheControl: '3600',
                        upsert: false
                    })

                if (error) throw error

                const { data: { publicUrl } } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath)

                uploadedUrls.push(publicUrl)
                setProgress(endProgress)
            }

            emitChange(multiple ? [...imageValues, ...uploadedUrls] : uploadedUrls)
            toast.success(
                multiple && uploadedUrls.length > 1
                    ? `${uploadedUrls.length} imágenes subidas correctamente`
                    : 'Imagen subida correctamente'
            )
        } catch (error: unknown) {
            console.error('Upload error:', error)
            toast.error(`Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setUploading(false)
            setProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const onRemove = (index: number) => {
        emitChange(imageValues.filter((_, currentIndex) => currentIndex !== index))
    }

    const openPicker = () => {
        if (!disabled && !uploading && (!multiple || !isAtLimit)) {
            fileInputRef.current?.click()
        }
    }

    const uploadTile = (compact = false) => (
        <button
            type="button"
            onClick={openPicker}
            disabled={disabled || uploading || isAtLimit}
            className={`${compact ? 'w-full aspect-square' : 'w-40 h-40'} border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition bg-muted/20 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60`}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-2 px-4 w-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <Progress value={progress} className="h-1 w-full" />
                    <span className="text-[10px] text-muted-foreground">Subiendo...</span>
                </div>
            ) : (
                <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                        {multiple ? 'Agregar foto' : 'Click para subir foto'}
                    </span>
                </>
            )}
        </button>
    )

    const renderInput = () => (
        <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={onFileUpload}
            disabled={disabled || uploading || isAtLimit}
        />
    )

    if (multiple) {
        return (
            <div className="space-y-3 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageValues.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                            <Image
                                fill
                                src={url}
                                alt={`Imagen ${index + 1}`}
                                className="object-cover"
                            />
                            {index === 0 && (
                                <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold shadow">
                                    Portada
                                </span>
                            )}
                            <button
                                onClick={() => onRemove(index)}
                                type="button"
                                disabled={disabled || uploading}
                                className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full hover:opacity-80 transition disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {!disabled && !isAtLimit && uploadTile(true)}
                </div>
                <p className="text-xs text-muted-foreground">
                    La primera imagen se usa como portada en el inventario. Máximo: {maxFiles} imágenes.
                </p>
                {renderInput()}
            </div>
        )
    }

    return (
        <div className="space-y-4 w-full flex flex-col items-center justify-center">
            {imageValues[0] ? (
                <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
                    <Image
                        fill
                        src={imageValues[0]}
                        alt="Product image"
                        className="object-cover"
                    />
                    <button
                        onClick={() => onRemove(0)}
                        type="button"
                        disabled={disabled || uploading}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full hover:opacity-80 transition disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                uploadTile()
            )}
            {renderInput()}
        </div>
    )
}
