import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isLoginPage = nextUrl.pathname === '/login'
    const isApiRoute = nextUrl.pathname.startsWith('/api')
    const isStaticFile = nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webmanifest)$/) ||
        nextUrl.pathname === '/favicon.ico' ||
        nextUrl.pathname === '/logo.png'

    // Allow API routes and static files
    if (isApiRoute || isStaticFile) {
        return
    }

    // If user is logged in and trying to access login page, redirect to dashboard
    if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/inicio', nextUrl))
    }

    // If user is not logged in and trying to access any page except login, redirect to login
    if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL('/login', nextUrl))
    }

    // Allow the request to proceed
    return
})

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|images/).*)'],
}
