import { getCurrentRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, LayoutTemplate, Users, Settings } from 'lucide-react'

const adminSections = [
    {
        href: '/admin/users',
        icon: Users,
        title: 'Usuarios',
        description: 'Gestiona los usuarios y sus roles de acceso al sistema.',
        color: 'bg-purple-50 text-purple-600',
    },
    {
        href: '/admin/contenido',
        icon: LayoutTemplate,
        title: 'Contenido Web',
        description: 'Edita secciones, textos e imágenes de tu página web.',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        href: '/admin/pagos',
        icon: CreditCard,
        title: 'Métodos de Pago',
        description: 'Administra los bancos y cuentas para recibir transferencias.',
        color: 'bg-green-50 text-green-600',
    },
]

export default async function AdminPage() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') redirect('/')

    return (
        <div className="flex-1 space-y-4 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Administración</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona usuarios, contenido y configuración de tu plataforma
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => {
                    const Icon = section.icon
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                        >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${section.color}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                    {section.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                    {section.description}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
