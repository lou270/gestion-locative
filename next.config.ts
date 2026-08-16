import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Politique de sécurité du contenu.
 *
 * `script-src` et `style-src` restent permissifs : Next.js injecte ses scripts
 * d'hydratation en ligne et Tailwind des styles en ligne, qu'une politique
 * stricte casserait sans nonce calculé par requête. Les autres directives ne
 * coûtent rien ici et ferment des détournements réels : réécriture de la base
 * des URL relatives (`base-uri`), envoi d'un formulaire vers un domaine tiers
 * (`form-action`), injection de plugin (`object-src`).
 *
 * Toutes les ressources sont servies depuis l'origine : `next/font` auto-héberge
 * les fontes sous `/_next/static/media`, aucune police ni feuille de style
 * distante n'est chargée.
 */
const contentSecurityPolicy = [
    "default-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    // `ws:` en développement seulement : le rechargement à chaud ouvre un
    // websocket, que certains navigateurs refusent de faire correspondre à
    // `'self'`.
    isDev ? "connect-src 'self' ws:" : "connect-src 'self'",
].join('; ')

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
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
    // Impose HTTPS pour les visites suivantes. Absent en développement, où le
    // serveur est en HTTP simple : un HSTS posé sur `localhost` s'appliquerait
    // à tous les autres projets servis depuis la même origine.
    ...(isDev
        ? []
        : [
              {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
              },
          ]),
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
