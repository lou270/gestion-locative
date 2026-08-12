'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

import { signIn } from '@/auth'
import { clientKeyFromHeaders, formatRetryDelay, getLoginStatus } from '@/lib/rate-limit'

function blockedMessage(retryAfterMs: number) {
    return `Trop de tentatives. Réessayez dans ${formatRetryDelay(retryAfterMs)}.`
}

/** Message d'échec, en prévenant l'utilisateur quand le blocage approche. */
function failureMessage(key: string) {
    const status = getLoginStatus(key)
    if (status.blocked) return blockedMessage(status.retryAfterMs)

    if (status.remaining > 0 && status.remaining <= 2) {
        return `Identifiants incorrects. Encore ${status.remaining} essai${
            status.remaining > 1 ? 's' : ''
        } avant blocage temporaire.`
    }
    return 'Identifiants incorrects.'
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    const email = String(formData.get('email') ?? '')
    const key = clientKeyFromHeaders(await headers(), email || 'anonyme')

    // Le blocage lui-même est appliqué dans `authorize` (voir `src/auth.ts`),
    // qui couvre aussi les appels directs à l'API. Ici on se contente de
    // l'annoncer : sans message, un compte bloqué renverrait « identifiants
    // incorrects » et l'utilisateur légitime chercherait une faute de frappe.
    const status = getLoginStatus(key)
    if (status.blocked) return blockedMessage(status.retryAfterMs)

    try {
        // Selon la version de next-auth, un échec se manifeste soit par une
        // exception, soit par un `error` dans le résultat : on couvre les deux.
        const result = await signIn('credentials', {
            email,
            password: formData.get('password'),
            redirect: false,
        })

        if (result && typeof result === 'object' && 'error' in result && result.error) {
            return failureMessage(key)
        }
    } catch (error) {
        if (error instanceof AuthError) return failureMessage(key)
        throw error
    }

    // `redirect` lève une exception interne à Next : elle doit rester hors du
    // bloc `try`, sinon elle serait interceptée comme une erreur de connexion.
    redirect('/')
}
