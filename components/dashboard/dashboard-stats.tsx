'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Package, RotateCcw, BarChart3, TrendingUp, DollarSign, AlertTriangle, Users, UserCheck, Award, Activity } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid, Line, LineChart } from "recharts"
import Link from "next/link"

interface DashboardStatsProps {
    data: {
        // Original stats
        activeReservations: number
        totalInventory: number
        pendingReturns: number
        inventoryValue: number
        monthlyStats: Array<{ name: string; value: number; fill: string }>
        categoryStats: Array<{ name: string; value: number }>
        recentEvents: any[]
        // Revenue stats
        totalRevenue?: number
        totalDamageCost?: number
        projectedRevenue?: number
        monthlyRevenue?: Array<{ name: string; value: number; fill: string }>
        // Client stats
        totalClients?: number
        activeClients?: number
        topClients?: Array<{ name: string; eventCount: number }>
        // Product stats
        topRentedProducts?: Array<{ name: string; count: number }>
        topDamagedProducts?: Array<{ name: string; count: number }>
        utilizationRate?: number
        // Event stats
        completedEvents?: number
        cancelledEvents?: number
        averageEventValue?: number
    }
}

export function DashboardStats({ data }: DashboardStatsProps) {
    const [showChart, setShowChart] = useState<'events' | 'revenue'>('events')
    const [showProductView, setShowProductView] = useState<'categories' | 'rented' | 'damaged'>('categories')

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
    }

    return (
        <div className="space-y-6">
            {/* Main Stats Row */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                <Link href="/events" className="block text-inherit no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.activeReservations}</div>
                            <p className="text-xs text-muted-foreground">
                                Eventos en curso o programados
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/inventory" className="block text-inherit no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inventario Total</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.totalInventory}</div>
                            <p className="text-xs text-muted-foreground">
                                Items registrados
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/events" className="block text-inherit no-underline">
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Devoluciones</CardTitle>
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.pendingReturns}</div>
                            <p className="text-xs text-muted-foreground">
                                Pendientes de procesar
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Revenue Stats Row */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data.totalRevenue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            De eventos completados
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Daños</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data.totalDamageCost || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Costo de productos dañados pendientes
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Proyectados</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(data.projectedRevenue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            De eventos activos/reservados
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(data.averageEventValue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Por evento completado
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Client & Utilization Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalClients || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Clientes registrados
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeClients || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Con eventos en curso
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Utilización</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(data.utilizationRate || 0).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Inventario en uso actualmente
                        </p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eventos Completados</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.completedEvents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Total finalizados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Events/Revenue Chart */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">
                                {showChart === 'events' ? 'Eventos por Mes' : 'Ingresos Mensuales'}
                            </CardTitle>
                            <CardDescription>
                                Últimos 6 meses
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground hover:text-primary"
                            onClick={() => setShowChart(showChart === 'events' ? 'revenue' : 'events')}
                        >
                            <BarChart3 className="h-4 w-4" />
                            {showChart === 'events' ? 'Ver Ingresos' : 'Ver Eventos'}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-[300px] overflow-x-auto flex justify-center items-center">
                            {showChart === 'events' ? (
                                <BarChart width={500} height={250} data={data.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {data.monthlyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <LineChart width={500} height={250} data={data.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)'
                                        }}
                                        formatter={(value: any) => formatCurrency(value)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--chart-1)"
                                        strokeWidth={2}
                                        dot={{ fill: 'var(--chart-1)', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Product Stats */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">
                                Estadísticas de Productos
                            </CardTitle>
                            <CardDescription>
                                {showProductView === 'categories' ? 'Por categorías' :
                                    showProductView === 'rented' ? 'Más rentados' : 'Más dañados'}
                            </CardDescription>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant={showProductView === 'categories' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setShowProductView('categories')}
                            >
                                Cat
                            </Button>
                            <Button
                                variant={showProductView === 'rented' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setShowProductView('rented')}
                            >
                                Top
                            </Button>
                            <Button
                                variant={showProductView === 'damaged' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setShowProductView('damaged')}
                            >
                                Daños
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-[250px] w-full">
                            {showProductView === 'categories' ? (
                                <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
                                    {data.categoryStats.slice(0, 6).map((cat, i) => (
                                        <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-3 w-3 rounded-full shrink-0"
                                                    style={{ background: `var(--chart-${(i % 5) + 1})` }}
                                                />
                                                <span className="text-sm font-medium truncate max-w-[120px]" title={cat.name}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <span className="font-bold tabular-nums">{cat.value}</span>
                                        </div>
                                    ))}
                                    {data.categoryStats.length > 6 && (
                                        <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                            + {data.categoryStats.length - 6} más...
                                        </div>
                                    )}
                                    {data.categoryStats.length === 0 && (
                                        <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
                                            No hay productos registrados
                                        </div>
                                    )}
                                </div>
                            ) : showProductView === 'rented' ? (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                    {(data.topRentedProducts || []).map((product, i) => (
                                        <div key={product.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <span className="text-sm font-medium truncate max-w-[200px]" title={product.name}>
                                                    {product.name}
                                                </span>
                                            </div>
                                            <span className="font-bold tabular-nums text-primary">{product.count} rentas</span>
                                        </div>
                                    ))}
                                    {(!data.topRentedProducts || data.topRentedProducts.length === 0) && (
                                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                                            No hay datos de rentas
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                    {(data.topDamagedProducts || []).map((product, i) => (
                                        <div key={product.name} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <span className="text-sm font-medium truncate max-w-[200px]" title={product.name}>
                                                    {product.name}
                                                </span>
                                            </div>
                                            <span className="font-bold tabular-nums text-orange-600">{product.count} dañados</span>
                                        </div>
                                    ))}
                                    {(!data.topDamagedProducts || data.topDamagedProducts.length === 0) && (
                                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                                            No hay productos dañados
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Clients Card */}
            {
                data.topClients && data.topClients.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Top 5 Clientes Frecuentes</CardTitle>
                            <CardDescription>Clientes con más eventos registrados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {data.topClients.map((client, i) => (
                                    <div key={client.name} className="flex flex-col p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm font-medium truncate flex-1" title={client.name}>
                                                {client.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{client.eventCount} eventos</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    )
}
