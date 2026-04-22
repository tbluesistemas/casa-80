'use client'

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { Session } from 'next-auth'
import { SessionProvider, useSession } from 'next-auth/react'

type UserRole = 'ADMIN' | 'VIEWER'

interface AuthContextType {
    role: UserRole
    setRole: (role: UserRole) => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthSessionProvider({
    children
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSession()
    const sessionRole = (session?.user?.role as UserRole) || 'VIEWER'
    const [role, setRole] = useState<UserRole>(sessionRole)

    useEffect(() => {
        setRole(sessionRole)
    }, [sessionRole])

    const value = useMemo<AuthContextType>(() => ({
        role,
        setRole,
        isLoading: status === 'loading'
    }), [role, status])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function AuthProvider({
    children,
    session
}: {
    children: React.ReactNode
    session?: Session | null
}) {
    return (
        <SessionProvider
            session={session}
            refetchInterval={0}
            refetchOnWindowFocus={false}
        >
            <AuthSessionProvider>{children}</AuthSessionProvider>
        </SessionProvider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}
