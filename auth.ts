import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    // Cast to any because Prisma types might not be updated yet due to EPERM error
                    const userWithPassword = user as any;

                    if (!userWithPassword.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, userWithPassword.password);
                    if (passwordsMatch) {
                        // Check if user is active
                        if (userWithPassword.active === false) {
                            console.log('User account is paused');
                            return null;
                        }

                        return {
                            ...user,
                            role: user.role as "ADMIN" | "VIEWER"
                        };
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
