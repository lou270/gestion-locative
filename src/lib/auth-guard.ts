import { auth } from '@/auth'

/**
 * Erreur levée par les server actions quand la session est absente.
 * Le message est affichable tel quel dans l'UI.
 */
export class UnauthorizedError extends Error {
    constructor(message = 'Session expirée, veuillez vous reconnecter.') {
        super(message)
        this.name = 'UnauthorizedError'
    }
}

/**
 * Garde pour les server actions et les pages. Lève si l'utilisateur n'est pas
 * connecté.
 *
 * Le garde des route handlers vit dans `@/lib/api-guard` : il dépend de
 * `next/server`, indisponible hors environnement Node.
 */
export async function requireSession() {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    return session
}
