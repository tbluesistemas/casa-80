'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, Package, PlusCircle, Users, LogOut, CreditCard, LayoutTemplate, Settings } from "lucide-react";
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

    const adminLinks = role === 'ADMIN' ? [
        { href: "/admin", label: "Panel Admin", icon: Settings },
        { href: "/admin/users", label: "Usuarios", icon: Users },
        { href: "/admin/contenido", label: "Contenido Web", icon: LayoutTemplate },
        { href: "/admin/pagos", label: "Métodos de Pago", icon: CreditCard },
    ] : [];

    return (
        <div className={cn("flex h-full w-64 flex-col border-r bg-background", className)}>
            <div className="flex flex-col items-center px-6 py-4 border-b gap-2">
                <img src="/logo.png" alt="Casa80 Logo" className="h-16 w-auto object-contain" />
                <div className="text-[9px] leading-tight text-muted-foreground font-semibold uppercase tracking-wider text-center">
                    El ALIADO perfecto para tus eventos!
                </div>
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
                    {adminLinks.length > 0 && (
                        <>
                            <div className="px-3 pt-4 pb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                    Administración
                                </span>
                            </div>
                            {adminLinks.map((link) => {
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
                        </>
                    )}
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
