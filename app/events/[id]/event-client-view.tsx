'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { AutoPrint } from "@/components/events/auto-print";
import {
    ArrowLeft,
    RotateCcw,
    Pencil,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    CreditCard,
    Box,
    Clock,
    Minus,
    Plus
} from "lucide-react";
import { EventStatusControl } from "@/components/events/event-status-control";
import { PrintButton } from "@/components/events/print-button";
import { EventStatus, EVENT_STATUS_LABELS } from "@/lib/event-status";
import { cn } from "@/lib/utils";

export function EventClientView({ event, role }: { event: any; role: string }) {
    const [days, setDays] = useState<number>(() => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays);
    });

    const formatDateInfo = (date: Date) => {
        return {
            full: new Intl.DateTimeFormat('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)),
            time: new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(date))
        };
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    }

    // Calculations
    const baseSubtotal = event.items.reduce((acc: number, item: any) => acc + (item.quantity * (item.product.priceUnit || 0)), 0);
    const subtotal = baseSubtotal * days;
    const transport = event.transport || 0;
    const discountPercent = event.discount || 0;
    const subWithTrans = subtotal + transport;
    const discountAmount = subWithTrans * (discountPercent / 100);
    const deposit = event.deposit || 0;
    const withDiscount = subWithTrans - discountAmount;
    const ivaPercent = event.iva || 0;
    const ivaAmount = withDiscount * (ivaPercent / 100);
    const total = withDiscount + ivaAmount;

    const startDate = formatDateInfo(event.startDate);
    const endDate = formatDateInfo(event.endDate);

    return (
        <div className="reservation-print-page flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 max-w-7xl mx-auto print:p-0 print:pt-4 print:max-w-none">
            {/* --- PRINT LOGO HEADER (only visible when printing) --- */}
            <div className="reservation-print-header hidden print:flex print:flex-col print:items-center print:mb-4">
                <Image
                    src="/logo.png"
                    alt="Casa 80 - Logistik Events"
                    width={150}
                    height={82}
                    className="reservation-print-main-logo object-contain"
                    priority
                />
                <div className="text-center mt-2">
                    <h1 className="text-lg font-bold">{event.name}</h1>
                    <p className="text-xs text-muted-foreground">Referencia: {event.id.slice(-6)}</p>
                </div>
            </div>

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight print:text-xl truncate max-w-[250px] sm:max-w-none">{event.name}</h2>
                        <Badge variant="outline" className="text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 hidden md:inline-flex print:inline-flex print:border-0 print:px-0">
                            {event.id.slice(-6)}
                        </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                        {startDate.full}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap print:hidden">
                    {/* Days setting */}
                    <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border">
                        <span className="text-xs font-medium mr-1 uppercase text-muted-foreground">Días:</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full" 
                            onClick={() => setDays(Math.max(1, days - 1))}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold w-6 text-center">{days}</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full" 
                            onClick={() => setDays(days + 1)}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <PrintButton />

                    {role === 'ADMIN' && ['SIN_CONFIRMAR', 'RESERVADO'].includes(event.status) && (
                        <Link href={`/events/${event.id}/edit`}>
                            <Button variant="outline" size="sm" className="md:h-10 md:px-4 md:py-2">
                                <Pencil className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Editar</span>
                                <span className="sm:hidden text-xs">Editar</span>
                            </Button>
                        </Link>
                    )}

                    {role === 'ADMIN' && !['CANCELADO', 'SIN_CONFIRMAR'].includes(event.status) && (
                        <Link href={`/events/${event.id}/return`}>
                            <Button variant="secondary" size="sm" className="md:h-10 md:px-4 md:py-2">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Devolución</span>
                                <span className="sm:hidden text-xs">Devolución</span>
                            </Button>
                        </Link>
                    )}

                    <Link href="/events">
                        <Button variant="outline" size="sm" className="md:h-10 md:px-4 md:py-2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Volver</span>
                            <span className="sm:hidden text-xs">Volver</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <Separator className="print:hidden" />

            <div className="reservation-print-content grid grid-cols-1 md:grid-cols-3 gap-6 print:grid print:grid-cols-2 print:gap-x-8 print:gap-y-4 print:auto-rows-min">

                {/* --- LEFT COLUMN (2/3) --- */}
                <div className="md:col-span-2 space-y-6 print:contents">
                    {/* ITEMS TABLE */}
                    <Card className="reservation-print-products overflow-hidden print:order-3 print:col-span-2 print:shadow-none print:border-0">
                        <CardHeader className="bg-muted/30 pb-4 px-4 md:px-6 print:bg-transparent print:p-0 print:pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2 print:text-sm">
                                    <Box className="h-4 w-4 md:h-5 md:w-5 text-primary print:h-4 print:w-4" />
                                    Detalle de Productos
                                    {days > 1 && (
                                        <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20 print:border-0 print:bg-transparent print:p-0">
                                            (Alquiler por {days} días)
                                        </Badge>
                                    )}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs print:hidden">{event.items.length} items</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Mobile: Cards */}
                            <div className="md:hidden print:hidden divide-y">
                                {event.items.map((item: any) => (
                                    <div key={item.productId} className="p-4 space-y-2">
                                        <div className="flex justify-between gap-2">
                                            <div className="font-medium text-sm flex-1">{item.product.name}</div>
                                            <div className="font-bold text-sm shrink-0">
                                                {formatCurrency((item.product.priceUnit || 0) * item.quantity * days)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <div>
                                                {formatCurrency(item.product.priceUnit || 0)} x {item.quantity} {days > 1 ? `x ${days} días` : ''}
                                            </div>
                                            {(item.returnedDamaged > 0 || item.returnedGood > 0) && (
                                                <div className="flex flex-col items-end gap-1 mt-1">
                                                    {item.returnedGood > 0 && <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">✓ {item.returnedGood} ok</Badge>}
                                                    {item.returnedDamaged > 0 && <Badge variant="outline" className="text-[10px] text-destructive border-red-200 bg-red-50">⚠ {item.returnedDamaged} dañados</Badge>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: Table */}
                            <div className="hidden md:block print:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/10 print:bg-transparent print:border-b-black">
                                            <TableHead className="w-[50%] print:text-black font-bold print:h-8 print:text-xs">Producto</TableHead>
                                            <TableHead className="text-right print:text-black font-bold print:h-8 print:text-xs">Precio Unit.</TableHead>
                                            <TableHead className="text-center print:text-black font-bold print:h-8 print:text-xs">Cant.</TableHead>
                                            <TableHead className="text-right print:text-black font-bold print:h-8 print:text-xs">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="print:text-xs">
                                        {event.items.map((item: any) => (
                                            <TableRow key={item.productId} className="group print:border-b-muted/50">
                                                <TableCell className="font-medium print:py-1">
                                                    <div className="flex flex-col">
                                                        <span>{item.product.name}</span>
                                                        {(item.returnedDamaged > 0 || item.returnedGood > 0) && (
                                                            <span className="text-xs text-muted-foreground flex gap-2 mt-1">
                                                                {item.returnedGood > 0 && <span className="text-green-600">✓ {item.returnedGood} devueltos</span>}
                                                                {item.returnedDamaged > 0 && <span className="text-destructive">⚠ {item.returnedDamaged} dañados</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground print:py-1">
                                                    {formatCurrency(item.product.priceUnit || 0)}
                                                    {days > 1 && <span className="block text-[10px] text-muted-foreground/70">x {days} días</span>}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold print:py-1">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right font-medium print:py-1">
                                                    {formatCurrency((item.product.priceUnit || 0) * item.quantity * days)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* FINANCIAL SUMMARY */}
                    <Card className="reservation-print-summary print:order-4 print:col-span-2 print:shadow-none print:border-0">
                        <CardContent className="p-6 print:p-0">
                            <div className="flex flex-col items-end gap-2 text-sm print:text-xs">
                                <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-sm print:w-64">
                                    <span className="text-muted-foreground print:text-black">
                                        Subtotal {days > 1 ? `(${days} días)` : ''}
                                    </span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {transport > 0 && (
                                    <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-sm print:w-64">
                                        <span className="text-muted-foreground print:text-black">Transporte</span>
                                        <span>+{formatCurrency(transport)}</span>
                                    </div>
                                )}
                                {discountPercent > 0 && (
                                    <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-sm print:w-64">
                                        <span className="text-muted-foreground print:text-black">Descuento ({discountPercent}%)</span>
                                        <span className="text-blue-600 font-medium">-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {ivaPercent > 0 && (
                                    <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-sm print:w-64">
                                        <span className="text-muted-foreground print:text-black">IVA ({ivaPercent}%)</span>
                                        <span>+{formatCurrency(ivaAmount)}</span>
                                    </div>
                                )}
                                {deposit > 0 && (
                                    <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-sm print:w-64">
                                        <span className="text-muted-foreground print:text-black">Depósito de garantía (se devuelve)</span>
                                        <span className="font-medium">{formatCurrency(deposit)}</span>
                                    </div>
                                )}
                                <Separator className="my-2 w-full md:w-1/2 lg:w-1/3 print:w-64 print:my-1" />
                                <div className="flex justify-between w-full md:w-1/2 lg:w-1/3 text-lg font-bold print:w-64 print:text-base">
                                    <span>Total a Pagar</span>
                                    <span className="text-primary print:text-black">{formatCurrency(Math.max(0, total))}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NOTES */}
                    {event.notes && (
                        <Card className="print:order-5 print:shadow-none print:border-0 print:mt-4">
                            <CardHeader className="pb-3 md:pb-3 print:p-0 print:pb-1">
                                <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                                    <FileText className="h-4 w-4" />
                                    Notas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="print:p-0">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-md print:bg-transparent print:p-0 print:text-xs print:text-black">
                                    {event.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* --- RIGHT COLUMN (1/3) --- */}
                <div className="space-y-6 print:contents">

                    {/* STATUS CARD (Hidden on print) */}
                    <Card className="border-l-4 border-l-primary shadow-sm print:hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Estado Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="scale-110 origin-left">
                                    <EventStatusControl
                                        eventId={event.id}
                                        currentStatus={event.status as EventStatus}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CLIENT INFO */}
                    <Card className="print:order-1 print:shadow-none print:border-0">
                        <CardHeader className="bg-muted/30 pb-3 print:bg-transparent print:p-0 print:pb-2">
                            <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                                <User className="h-4 w-4" />
                                Información del Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 print:p-0 print:space-y-1">
                            {event.client ? (
                                <>
                                    <div className="space-y-1 print:space-y-0">
                                        <p className="font-semibold text-lg print:text-sm">{event.client.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-xs print:text-black">
                                            <CreditCard className="h-3 w-3" />
                                            <span>{event.client.document || "Sin documento"}</span>
                                        </div>
                                    </div>
                                    <Separator className="print:hidden" />
                                    <div className="space-y-3 text-sm print:space-y-0 print:grid print:grid-cols-1 print:gap-0">
                                        <div className="flex items-start gap-3 print:gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 print:h-3 print:w-3" />
                                            <span className="print:text-xs">{event.client.phone || "Sin teléfono"}</span>
                                        </div>
                                        <div className="flex items-start gap-3 print:gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 print:h-3 print:w-3" />
                                            <span className="break-all print:text-xs">{event.client.email || "Sin correo"}</span>
                                        </div>
                                        <div className="flex items-start gap-3 print:gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 print:h-3 print:w-3" />
                                            <span className="print:text-xs">{event.client.address ? `${event.client.address}, ${event.client.city}` : "Sin dirección"}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">
                                    Cliente no registrado.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* DATES */}
                    <Card className="print:order-2 print:shadow-none print:border-0">
                        <CardHeader className="bg-muted/30 pb-3 print:bg-transparent print:p-0 print:pb-2">
                            <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                                <Calendar className="h-4 w-4" />
                                Fechas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 print:p-0 print:space-y-2">
                            <div className="relative pl-4 border-l-2 border-primary/20 space-y-1 print:border-0 print:pl-0">
                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-primary print:hidden" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:hidden">Inicio</p>
                                <div className="flex flex-col print:flex-row print:gap-2">
                                    <span className="text-xs font-bold w-12 hidden print:inline-block">INICIO:</span>
                                    <p className="font-medium print:text-xs">{startDate.full}</p>
                                </div>
                            </div>
                            <div className="relative pl-4 border-l-2 border-primary/20 space-y-1 print:border-0 print:pl-0">
                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-primary/30 print:hidden" />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider print:hidden">Fin</p>
                                <div className="flex flex-col print:flex-row print:gap-2">
                                    <span className="text-xs font-bold w-12 hidden print:inline-block">FIN:</span>
                                    <p className="font-medium print:text-xs">{endDate.full}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* HISTORY TIMELINE */}
                    <Card className="print:order-6 print:col-span-2 print:shadow-none print:border-0 print:break-before-auto print:mt-4 print:hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Historial de Cambios
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-6 relative ml-2">
                                {/* Vertical Line */}
                                <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />

                                {event.history && event.history.length > 0 ? (
                                    event.history.map((record: any, index: number) => (
                                        <div key={record.id} className="relative pl-6">
                                            {/* Dot */}
                                            <div className={cn(
                                                "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border border-background",
                                                index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                                            )} />

                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "text-sm font-medium leading-none",
                                                    index === 0 && "text-primary"
                                                )}>
                                                    {EVENT_STATUS_LABELS[record.newStatus as keyof typeof EVENT_STATUS_LABELS] || record.newStatus}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Intl.DateTimeFormat('es-MX', {
                                                        day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric'
                                                    }).format(new Date(record.createdAt))}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="pl-6 text-sm text-muted-foreground italic">
                                        Sin historial registrado.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PRINT FOOTER */}
            <footer className="reservation-print-footer">
                <div className="reservation-print-footer-inner">
                    <Image
                        src="/logo.png"
                        alt="Casa 80"
                        width={42}
                        height={42}
                        className="object-contain opacity-90 shrink-0"
                    />
                    <div>
                        <p className="text-[10px] leading-3 font-semibold tracking-wide">
                            ¡Somos el aliado perfecto para todos tus eventos!
                        </p>
                        <div className="mt-1 text-[8px] leading-3 text-black/85">
                            <p>Dirección: Calle 80 #73-35, barrio paraíso - Barranquilla atlántico</p>
                            <p>Celular/Whatsapp: +57 3172100592 · Correo electrónico: casa80alquiler@gmail.com · Página Web: ¡Próximamente!</p>
                            <p>Instagram: @casa80alquiler · Tiktok: @casa80alquiler · Facebook: @casa 80</p>
                        </div>
                    </div>
                </div>
            </footer>
            <AutoPrint />
        </div>
    );
}
