'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Calendar } from "lucide-react"

interface DashboardFiltersProps {
    currentYear?: number
    currentMonth?: number
}

const MONTHS = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
]

export function DashboardFilters({ currentYear, currentMonth }: DashboardFiltersProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selectedYear, setSelectedYear] = useState<number | null>(currentYear ?? null)
    const [selectedMonth, setSelectedMonth] = useState<number | null>(currentMonth ?? null)

    const currentCalYear = new Date().getFullYear()
    const years = Array.from({ length: 6 }, (_, i) => currentCalYear - i)

    const hasFilters = selectedYear !== null || selectedMonth !== null
    const isLoading = isPending

    const handleApply = () => {
        startTransition(() => {
            const params = new URLSearchParams()
            if (selectedYear) params.set('year', selectedYear.toString())
            if (selectedMonth) params.set('month', selectedMonth.toString())
            router.push(`/inicio?${params.toString()}`)
        })
    }

    const handleClear = () => {
        setSelectedYear(null)
        setSelectedMonth(null)
        startTransition(() => {
            router.push('/inicio')
        })
    }

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base font-semibold">Filtros de Período</CardTitle>
                    </div>
                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="gap-2 text-muted-foreground hover:text-destructive"
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2 sm:gap-3">
                    <div className="sm:flex-1 sm:min-w-[150px]">
                        <label className="text-sm font-medium mb-2 block">Año</label>
                        <Select
                            value={selectedYear?.toString() || "all"}
                            onValueChange={(value) => setSelectedYear(value === "all" ? null : parseInt(value))}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los años" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los años</SelectItem>
                                {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="sm:flex-1 sm:min-w-[150px]">
                        <label className="text-sm font-medium mb-2 block">Mes</label>
                        <Select
                            value={selectedMonth?.toString() || "all"}
                            onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los meses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los meses</SelectItem>
                                {MONTHS.map(month => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleApply}
                        disabled={isLoading || !hasFilters}
                        className="gap-2 col-span-2 sm:col-span-1 w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Cargando...
                            </>
                        ) : (
                            <>
                                <Calendar className="h-4 w-4" />
                                Aplicar Filtros
                            </>
                        )}
                    </Button>
                </div>

                {!hasFilters && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            ℹ️ Mostrando historial completo
                        </span>
                    </div>
                )}

                {hasFilters && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Filtros activos:</span>
                        {selectedYear && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                                Año: {selectedYear}
                            </span>
                        )}
                        {selectedMonth && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                                Mes: {MONTHS.find(m => m.value === selectedMonth)?.label}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
