import { getCurrentRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ContenidoManager } from '@/components/admin/contenido-manager'
import { HeroCarouselManager } from '@/components/admin/hero-carousel-manager'
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
            
            <div className="grid gap-6 md:gap-8">
                {/* Gestor del Hero Carrusel */}
                <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Hero / Carrusel Principal</h3>
                        <p className="text-sm text-muted-foreground">
                            Imágenes dinámicas de la portada. Usa una sección de <b>Contenido Web</b> con tipo <b>Hero / Portada</b> para los textos.
                        </p>
                    </div>
                    <HeroCarouselManager />
                </div>

                {/* Gestor de otras secciones */}
                <div className="bg-card rounded-xl border p-4 md:p-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Secciones de Contenido (Textos e imágenes estáticas)</h3>
                        <p className="text-sm text-muted-foreground">
                            Secciones adicionales de información en la página web. Si deseas cambiar el texto del Hero Principal, edita la sección tipo "Hero / Portada".
                        </p>
                    </div>
                    <ContenidoManager />
                </div>
            </div>
        </div>
    )
}
