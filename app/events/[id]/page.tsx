import { getEventById } from "@/lib/actions";
import { getCurrentRole } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventClientView } from "./event-client-view";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [{ success, data: event, error }, role] = await Promise.all([
        getEventById(id),
        getCurrentRole(),
    ]);

    if (!success || !event) {
        return (
            <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
                <div className="text-destructive font-bold text-lg mb-2">Error</div>
                <p className="text-muted-foreground mb-4">{error || "Evento no encontrado"}</p>
                <Link href="/events">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al listado
                    </Button>
                </Link>
            </div>
        );
    }

    return <EventClientView event={event} role={role || "VIEWER"} />;
}
