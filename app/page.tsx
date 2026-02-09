'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Package, RotateCcw } from "lucide-react";
import styles from "./home.module.css";
import { getDashboardStats } from "@/lib/actions";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { DateFilters } from "@/components/dashboard/date-filters";
import { getStatusLabel } from "@/lib/utils-status";

const defaultData = {
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

export default function Home() {
    const [data, setData] = useState<any>(defaultData);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load initial data with Current Month by default
    useEffect(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();

        loadStats(year, currentMonth, true);
    }, []);

    const loadStats = async (year?: number | null, month?: number | null, isInitial: boolean = false) => {
        setIsLoading(true);
        try {
            const filters: { year?: number; month?: number } = {};

            // If no filters provided and not initial load, use Current Month as default
            if (!isInitial && year === undefined && month === undefined) {
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                filters.year = currentYear;
                filters.month = currentMonth;
            } else {
                if (year !== undefined && year !== null) filters.year = year;
                if (month !== undefined && month !== null) filters.month = month;
            }

            const stats = await getDashboardStats(Object.keys(filters).length > 0 ? filters : undefined);
            if (stats.success && stats.data) {
                setData(stats.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        loadStats(selectedYear, selectedMonth);
    };

    const handleClearFilters = () => {
        setSelectedYear(null);
        setSelectedMonth(null);
        // When clearing, go back to Current Month default
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const year = now.getFullYear();
        loadStats(year, currentMonth);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            day: 'numeric',
            month: 'short'
        }).format(new Date(date));
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Casa80</h2>
            </div>

            <DateFilters
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                isLoading={isLoading}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
                    </div>
                </div>
            ) : (
                <DashboardStats data={data} />
            )}

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
                            {data.recentEvents.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No hay eventos próximos.</p>
                            ) : (
                                data.recentEvents.map((event: any) => (
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
        </div>
    );
}
