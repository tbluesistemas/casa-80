import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
// auth.config.ts
callbacks: {
  // ... mantén tu lógica de authorized
  
  async jwt({ token, user }) {
    // Si el usuario acaba de iniciar sesión, guardamos su rol en el token
    if (user) {
      token.role = user.role;
    }
    return token;
  },

  async session({ session, token }) {
    // Pasamos el rol del token a la sesión del navegador
    if (token.role && session.user) {
      session.user.role = token.role as "ADMIN" | "VIEWER";
    }
    if (token.sub && session.user) {
      session.user.id = token.sub;
    }
    return session;
  },
},
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
