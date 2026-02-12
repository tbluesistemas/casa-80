'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, Package, PlusCircle, Users, LogOut } from "lucide-react";
import { signOut } from "next-auth/react"; // Assuming we use client-side signOut or server action
import { useRouter } from "next/navigation";

// Since signOut from next-auth/react is for client side, we need to wrap it or use a server action. 
// But simple way: use window.location or server action.
// Actually, standard way is import { signOut } from "next-auth/react" for client components.
// sidebar is 'use client'.

import { signOut as nextAuthSignOut } from "next-auth/react";
import { useAuth } from "@/components/auth-provider";

interface SidebarProps {
    onLinkClick?: () => void;
    className?: string; // Allow passing custom classes (like w-full)
}

export function Sidebar({ onLinkClick, className }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useAuth(); // Get current role

    const links = [
        { href: "/inicio", label: "Inicio", icon: Home },
        { href: "/events", label: "Reservas", icon: CalendarDays },
        { href: "/inventory", label: "Inventario", icon: Package },
        { href: "/clients", label: "Clientes", icon: Users },
    ];

    if (role === 'ADMIN') {
        links.push({ href: "/admin/users", label: "Usuarios", icon: Users });
    }

    return (
        <div className={cn("flex h-full w-64 flex-col border-r bg-background", className)}>
            <div className="flex h-16 items-center px-6 font-bold text-xl border-b">
                Casa80
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onLinkClick}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4 flex flex-col gap-2">
                {role === 'ADMIN' && (
                    <Link href="/events/new">
                        <Button className="w-full justify-start gap-2" variant="default">
                            <PlusCircle className="h-4 w-4" />
                            Nueva Reserva
                        </Button>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={() => nextAuthSignOut({ callbackUrl: '/login' })}
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
