'use client'

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Hide sidebar on standard full-screen pages like login
    const isPublicPage = pathname === "/login";

    if (isPublicPage) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                {children}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center h-16 border-b px-4 gap-4 sticky top-0 bg-background z-40">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Sidebar onLinkClick={() => setOpen(false)} className="border-none w-full shadow-none" />
                    </SheetContent>
                </Sheet>
                <div className="font-bold text-lg">Casa80</div>
            </header>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r bg-background fixed inset-y-0 z-30">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background md:pl-64">
                {children}
            </main>
        </div>
    );
}
