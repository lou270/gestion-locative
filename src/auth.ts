
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import {
    clearLoginAttempts,
    clientKeyFromHeaders,
    getLoginStatus,
    registerLoginFailure,
} from '@/lib/rate-limit';

async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials, request) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                // La limitation est appliquée ici, et non dans la server action
                // du formulaire : le point d'entrée `/api/auth/callback/credentials`
                // est joignable directement et contournerait ce contrôle.
                const key = clientKeyFromHeaders(
                    request?.headers ?? new Headers(),
                    parsedCredentials.success ? parsedCredentials.data.email : 'anonyme',
                );

                if (getLoginStatus(key).blocked) return null;

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);

                    if (user && (await bcrypt.compare(password, user.password))) {
                        clearLoginAttempts(key);
                        return user;
                    }
                }

                registerLoginFailure(key);
                return null;
            },
        }),
    ],
});
