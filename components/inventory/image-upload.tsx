'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ImageIcon, X, UploadCloud, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

// Supabase credentials will be checked during upload.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''


interface ImageUploadProps {
    value?: string | null
    onChange: (url: string | null) => void
    disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
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
                        0.7 // Quality
                    )
                }
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!supabaseUrl || !supabaseAnonKey) {
                toast.error('Error de configuración: Faltan las credenciales de Supabase en el archivo .env')
                return
            }

            const file = e.target.files?.[0]
            if (!file) return

            setUploading(true)
            setProgress(10)

            // Initialize client just in time to avoid module crash if env vars are missing
            const supabase = createClient(supabaseUrl, supabaseAnonKey)

            // 1. Compress
            const compressedBlob = await compressImage(file)
            setProgress(30)

            // 2. Upload to Supabase
            const fileExt = 'webp'
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `products/${fileName}`

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error
            setProgress(90)

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            onChange(publicUrl)
            toast.success('Imagen subida correctamente')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error('Error al subir la imagen: ' + error.message)
        } finally {
            setUploading(false)
            setProgress(0)
        }
    }

    const onRemove = () => {
        onChange(null)
    }

    return (
        <div className="space-y-4 w-full flex flex-col items-center justify-center">
            {value ? (
                <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
                    <Image
                        fill
                        src={value}
                        alt="Product image"
                        className="object-cover"
                    />
                    <button
                        onClick={onRemove}
                        type="button"
                        disabled={disabled || uploading}
                        className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full hover:opacity-80 transition disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                    className="w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition bg-muted/20"
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
                            <span className="text-xs text-muted-foreground text-center px-2">Click para subir foto</span>
                        </>
                    )}
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileUpload}
                disabled={disabled || uploading}
            />
        </div>
    )
}
