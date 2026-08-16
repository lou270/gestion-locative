/**
 * Limitation des tentatives de connexion.
 *
 * L'application n'a qu'un compte administrateur exposé sur Internet : sans
 * garde-fou, le formulaire accepte un nombre illimité d'essais.
 *
 * Le compteur vit en mémoire du processus. C'est suffisant ici — un seul
 * conteneur, une base SQLite locale — mais cela implique deux limites assumées :
 * le compteur repart de zéro au redémarrage, et il ne serait pas partagé entre
 * plusieurs répliques. Une limitation au niveau du reverse proxy reste le
 * complément recommandé.
 */

export const MAX_ATTEMPTS = 5
export const WINDOW_MS = 15 * 60 * 1000
export const BLOCK_MS = 15 * 60 * 1000

interface Bucket {
    failures: number
    /** Date de la première tentative de la fenêtre en cours. */
    windowStart: number
    /** Date jusqu'à laquelle la clé est bloquée. */
    blockedUntil: number
}

const buckets = new Map<string, Bucket>()

/** Supprime les compteurs devenus inutiles, pour borner la mémoire. */
function prune(now: number) {
    for (const [key, bucket] of buckets) {
        const expired = now - bucket.windowStart > WINDOW_MS && bucket.blockedUntil <= now
        if (expired) buckets.delete(key)
    }
}

export interface LoginAttemptStatus {
    blocked: boolean
    /** Millisecondes restantes avant de pouvoir réessayer. */
    retryAfterMs: number
    /** Essais encore permis avant blocage. */
    remaining: number
}

export function getLoginStatus(key: string, now: number = Date.now()): LoginAttemptStatus {
    const bucket = buckets.get(key)
    if (!bucket) return { blocked: false, retryAfterMs: 0, remaining: MAX_ATTEMPTS }

    if (bucket.blockedUntil > now) {
        return { blocked: true, retryAfterMs: bucket.blockedUntil - now, remaining: 0 }
    }

    // Fenêtre écoulée : le compteur repart à zéro.
    if (now - bucket.windowStart > WINDOW_MS) {
        return { blocked: false, retryAfterMs: 0, remaining: MAX_ATTEMPTS }
    }

    return {
        blocked: false,
        retryAfterMs: 0,
        remaining: Math.max(MAX_ATTEMPTS - bucket.failures, 0),
    }
}

/** Enregistre un échec et bloque la clé au-delà du seuil. */
export function registerLoginFailure(key: string, now: number = Date.now()): LoginAttemptStatus {
    prune(now)

    const bucket = buckets.get(key)

    // Une clé bloquée le reste : sans cette garde, un échec supplémentaire
    // remplacerait le compteur par un neuf et lèverait le blocage. Le cas ne
    // se produit pas aujourd'hui — `authorize` sort avant d'arriver ici — mais
    // l'efficacité du blocage ne doit pas dépendre d'un contrôle situé dans un
    // autre fichier.
    if (bucket && bucket.blockedUntil > now) return getLoginStatus(key, now)

    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
        const fresh: Bucket = { failures: 1, windowStart: now, blockedUntil: 0 }
        buckets.set(key, fresh)
        return getLoginStatus(key, now)
    }

    bucket.failures += 1
    if (bucket.failures >= MAX_ATTEMPTS) {
        bucket.blockedUntil = now + BLOCK_MS
    }

    return getLoginStatus(key, now)
}

/** Réinitialise le compteur : appelé après une connexion réussie. */
export function clearLoginAttempts(key: string) {
    buckets.delete(key)
}

/** Réservé aux tests. */
export function resetLoginAttempts() {
    buckets.clear()
}

/**
 * Un reverse proxy est-il déclaré devant l'application ?
 *
 * `X-Forwarded-For` et `X-Real-IP` ne sont dignes de foi que si quelque chose
 * les réécrit en amont. En exposition directe — `docker compose` publie le port
 * 3000 sur l'hôte, rien n'impose un proxy — ces en-têtes sont entièrement
 * fournis par l'appelant : les lire reviendrait à laisser l'attaquant choisir
 * son propre compteur, donc à annuler la limitation sur le seul compte
 * administrateur.
 *
 * On exige donc une déclaration explicite de l'exploitant plutôt que de deviner.
 */
export function isProxyTrusted(): boolean {
    const value = process.env.TRUST_PROXY?.trim().toLowerCase()
    return value === '1' || value === 'true'
}

/**
 * Identifie l'appelant à partir des en-têtes.
 *
 * Derrière un proxy déclaré : `X-Forwarded-For` est une liste dont le client
 * contrôle la partie gauche : un attaquant peut y injecter une valeur
 * arbitraire pour obtenir un compteur neuf à chaque essai. Nginx Proxy Manager
 * *ajoute* l'adresse réellement observée en fin de liste — c'est donc la
 * dernière entrée, et elle seule, qui fait foi.
 *
 * Sans proxy déclaré : les en-têtes sont ignorés et le compteur porte sur
 * l'identifiant fourni (l'email saisi). Moins fin qu'une IP, mais incontournable
 * — un attaquant visant le compte administrateur doit en employer l'adresse.
 */
export function clientKeyFromHeaders(
    headers: { get(name: string): string | null },
    fallback = 'inconnu',
    { trustProxy = isProxyTrusted() }: { trustProxy?: boolean } = {},
): string {
    if (trustProxy) {
        const forwarded = headers.get('x-forwarded-for')
        if (forwarded) {
            const parts = forwarded
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean)
            if (parts.length > 0) return `ip:${parts[parts.length - 1]}`
        }

        const realIp = headers.get('x-real-ip')
        if (realIp?.trim()) return `ip:${realIp.trim()}`
    }

    return `id:${fallback}`
}

/** « 3 minutes », « 45 secondes » — pour le message affiché à l'utilisateur. */
export function formatRetryDelay(retryAfterMs: number): string {
    const seconds = Math.ceil(retryAfterMs / 1000)
    if (seconds < 60) return `${seconds} seconde${seconds > 1 ? 's' : ''}`
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
