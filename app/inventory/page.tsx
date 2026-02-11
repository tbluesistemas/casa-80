import { getProducts } from "@/lib/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InventoryClient } from "@/components/inventory/inventory-client"

export default async function InventoryPage() {
    // Pass current date range (whole UTC day) to get real-time availability
    // This matches how events are often stored (00:00 UTC)
    const now = new Date()
    const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0))
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59))

    const { success, data: products, error } = await getProducts({
        startDate,
        endDate
    })

    if (!success || !products) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Error al Cargar</AlertTitle>
                    <AlertDescription>{error || "No se pudieron cargar los productos."}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Serialize dates to avoid hydration errors
    const serializedProducts = products.map(p => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
        createdAt: p.createdAt.toISOString()
    }))

    return <InventoryClient products={serializedProducts} />
}
