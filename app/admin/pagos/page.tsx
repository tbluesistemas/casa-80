import { getCurrentRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BancosManager } from '@/components/admin/bancos-manager'
import { CreditCard } from 'lucide-react'

export default async function PagosPage() {
    const role = await getCurrentRole()
    if (role !== 'ADMIN') redirect('/')

    return (
        <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Métodos de Pago</h2>
                    <p className="text-sm text-muted-foreground">
                        Administra los bancos y cuentas para transferencias
                    </p>
                </div>
            </div>
            <BancosManager />
        </div>
    )
}
