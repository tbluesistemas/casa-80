import { auth } from "@/auth"
import { cache } from "react"

export type UserRole = 'ADMIN' | 'VIEWER'

export const getCurrentSession = cache(async () => auth())

export async function getCurrentRole(): Promise<UserRole> {
    const session = await getCurrentSession()
    const role = session?.user?.role as UserRole

    // Default to VIEWER if not logged in (or handle redirect in middleware)
    return role || 'VIEWER'
}

// Deprecated: Switch role is now handled by logging in with different accounts
export async function switchUserRole(role: UserRole) {
    void role
    // No-op in real auth system
    console.warn("switchUserRole called but we are using real auth now.")
}
