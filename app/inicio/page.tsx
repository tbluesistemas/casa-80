import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Package, RotateCcw } from "lucide-react";
import styles from "./home.module.css";
import { getDashboardStats } from "@/lib/actions";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { getStatusLabel } from "@/lib/utils-status";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";

// Loading skeleton for initial dashboard render
function DashboardSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
            </div>
        </div>
    );
}

// Server component that fetches data
async function DashboardContent({ year, month }: { year?: number; month?: number }) {
    const filters: { year?: number; month?: number } = {};
    if (year) filters.year = year;
    if (month) filters.month = month;

    const stats = await getDashboardStats(Object.keys(filters).length > 0 ? filters : undefined);
    const data = stats.success && stats.data ? stats.data : {
        activeReservations: 0,
        totalInventory: 0,
        inventoryValue: 0,
        pendingReturns: 0,
        recentEvents: [],
        categoryStats: [],
        monthlyStats: [],
        totalRevenue: 0,
        damageRevenue: 0,
        projectedRevenue: 0,
        monthlyRevenue: [],
        totalClients: 0,
        activeClients: 0,
        topClients: [],
        topRentedProducts: [],
        topDamagedProducts: [],
        utilizationRate: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        averageEventValue: 0
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            day: 'numeric',
            month: 'short'
        }).format(new Date(date));
    };

    return (
        <>
            <DashboardStats data={data} />

            <div className={styles.mainGrid}>
                <Card className={styles.quickActionsCard}>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>
                            Gestiona el inventario y las reservas desde aquí.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContentActions}>
                        <div className={styles.actionsGrid}>
                            <Link href="/events/new">
                                <Button className={styles.actionButton} variant="outline">
                                    <CalendarDays className={styles.actionIcon} />
                                    Nueva Reserva
                                </Button>
                            </Link>
                            <Link href="/inventory">
                                <Button className={styles.actionButton} variant="outline">
                                    <Package className={styles.actionIcon} />
                                    Ver Inventario
                                </Button>
                            </Link>
                            <Link href="/events">
                                <Button className={styles.actionButton} variant="outline">
                                    <RotateCcw className={styles.actionIcon} />
                                    Gestionar Devoluciones
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
                <Card className={styles.eventsCard}>
                    <CardHeader>
                        <Link href="/events" className="hover:underline">
                            <CardTitle>Próximos Eventos &rarr;</CardTitle>
                        </Link>
                        <CardDescription>Eventos programados próximamente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={styles.eventsList}>
                            {(data as any).recentEvents.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No hay eventos próximos.</p>
                            ) : (
                                (data as any).recentEvents.map((event: any) => (
                                    <Link key={event.id} href={`/events/${event.id}`}>
                                        <div className={`${styles.eventItem} ${styles.clickableRow}`}>
                                            <div className={styles.eventInfo}>
                                                <p className={styles.eventName}>{event.name}</p>
                                                <p className={styles.eventTime}>
                                                    {formatDate(event.startDate)}
                                                </p>
                                            </div>
                                            <div className={styles.eventStatus}>{getStatusLabel(event.status)}</div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// Main page — Server Component with search params for filters
export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>
}) {
    const params = await searchParams;
    const year = params.year ? parseInt(params.year) : undefined;
    const month = params.month ? parseInt(params.month) : undefined;

    return (
        <div className="flex-1 space-y-4 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">DASHBOARD CASA80</h2>
            </div>

            <DashboardFilters currentYear={year} currentMonth={month} />

            <Suspense key={`${year}-${month}`} fallback={<DashboardSkeleton />}>
                <DashboardContent year={year} month={month} />
            </Suspense>
        </div>
    );
}
