import type { NextConfig } from 'next'

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * L'application manipule des données personnelles de locataires (identité,
 * coordonnées, situation d'impayé) : ces en-têtes limitent le détournement
 * d'affichage et la fuite d'URL vers des sites tiers.
 */
const securityHeaders = [
    // Interdit l'inclusion dans une iframe (clickjacking).
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
    // Empêche le navigateur de deviner un type MIME différent de celui annoncé.
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Ne transmet pas le chemin (qui contient des identifiants de locataires)
    // aux domaines tiers.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
]

const nextConfig: NextConfig = {
    output: 'standalone',

    // N'annonce pas la version du framework.
    poweredByHeader: false,

    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }]
    },
}

export default nextConfig
