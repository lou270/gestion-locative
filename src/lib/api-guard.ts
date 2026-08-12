import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Garde pour les route handlers.
 *
 * Le matcher de `src/proxy.ts` exclut `/api`, donc aucune route API n'est
 * protégée par le middleware : chaque handler doit se garder lui-même.
 *
 * Usage :
 *   const denied = await guardApiRoute()
 *   if (denied) return denied
 */
export async function guardApiRoute(): Promise<NextResponse | null> {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return null
}
