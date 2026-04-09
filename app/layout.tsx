import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import styles from "./layout.module.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casa80 App",
  description: "Gestión de inventario y reservas",
  icons: {
    icon: "/favicon.ico",
  },
};

import { AuthProvider } from "@/components/auth-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${styles.body}`}
      >
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
