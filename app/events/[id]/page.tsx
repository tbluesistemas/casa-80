import { getEventById } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Pencil } from "lucide-react";
import { getCurrentRole } from "@/lib/auth";
import { EventStatusControl } from "@/components/events/event-status-control";
import { EventStatus } from "@/lib/event-status";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { success, data: event, error } = await getEventById(id);
    const role = await getCurrentRole();

    if (!success || !event) {
        return (
            <div className="p-8">
                <div className="text-red-500 font-bold">Error: {error || "Evento no encontrado"}</div>
                <Link href="/events">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </Link>
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }).format(new Date(date));
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">{event.name}</h2>
                    <p className="text-muted-foreground">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/events">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    {role === 'ADMIN' && ['SIN_CONFIRMAR', 'RESERVADO'].includes(event.status) && (
                        <Link href={`/events/${event.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    )}
                    {role === 'ADMIN' && !['CANCELADO'].includes(event.status) && (
                        <Link href={`/events/${event.id}/return`}>
                            <Button>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Gestionar Devolución
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <EventStatusControl
                                eventId={event.id}
                                currentStatus={event.status as EventStatus}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Items del Evento</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Devuelto (Bien)</TableHead>
                                <TableHead className="text-right">Dañado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {event.items.map((item: any) => (
                                <TableRow key={item.productId}>
                                    <TableCell className="font-medium">{item.product.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.returnedGood}</TableCell>
                                    <TableCell className="text-right text-red-500">
                                        {item.returnedDamaged > 0 ? item.returnedDamaged : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
