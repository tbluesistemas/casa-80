import { getCurrentRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ContenidoManager } from '@/components/admin/contenido-manager'
import { LayoutTemplate } from 'lucide-react'

export default async function ContenidoPage() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') redirect('/')

    return (
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <LayoutTemplate className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Contenido Web</h2>
                    <p className="text-sm text-muted-foreground">
                        Administra las secciones, imágenes y textos de tu página web
                    </p>
                </div>
            </div>
            <ContenidoManager />
        </div>
    )
}
