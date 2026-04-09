import { getEvents } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EventsList } from "@/components/events-list";
import { getCurrentRole } from "@/lib/auth";
import { ExportButton } from "@/components/export/export-button";

export default async function EventsPage() {
    const [{ data: events }, role] = await Promise.all([getEvents(), getCurrentRole()]);

    return (
        <div className="flex-1 space-y-4 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reservas</h2>
                <div className="flex gap-2 flex-wrap">
                    <ExportButton segment="events" />
                    {role === 'ADMIN' && (
                        <Link href="/events/new">
                            <Button className="w-full sm:w-auto">Nueva Reserva</Button>
                        </Link>
                    )}
                </div>
            </div>

            <EventsList events={events || []} role={role} />
        </div>
    );
}
