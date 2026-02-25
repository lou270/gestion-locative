
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/');
            const isLoginPage = nextUrl.pathname.startsWith('/login');

            // Allow static files and specific public endpoints (like webhooks)
            if (
                nextUrl.pathname.startsWith('/_next') ||
                nextUrl.pathname.startsWith('/api/webhooks')
            ) {
                return true;
            }

            if (isLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
