import type { NextAuthConfig } from 'next-auth'

/**
 * Durée de vie d'une session, en secondes.
 *
 * Le défaut d'Auth.js est de 30 jours. C'est long pour un back-office exposé
 * sur Internet qui contient l'identité, les coordonnées et la situation
 * d'impayé de locataires : un poste laissé ouvert reste utilisable un mois.
 * Douze heures couvrent une journée de travail sans reconnexion.
 */
export const SESSION_MAX_AGE = 12 * 60 * 60

/** Chemins joignables sans session. */
function isPublicPath(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        // Signé en HMAC dans le handler : voir `api/webhooks/yousign/route.ts`.
        pathname.startsWith('/api/webhooks')
    )
}

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: SESSION_MAX_AGE,
    },
    callbacks: {
        /**
         * Tout est privé sauf la page de connexion et les chemins publics
         * ci-dessus : l'application n'a aucune partie visiteur.
         */
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user

            if (isPublicPath(nextUrl.pathname)) return true

            if (nextUrl.pathname.startsWith('/login')) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            // `false` renvoie l'utilisateur non connecté vers `pages.signIn`.
            return isLoggedIn
        },
    },
    providers: [], // Les providers sont déclarés dans `auth.ts`.
} satisfies NextAuthConfig
