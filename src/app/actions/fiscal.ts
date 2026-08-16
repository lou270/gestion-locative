'use server'

import prisma from '@/lib/prisma'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { buildFiscalSummary, type FiscalExpense, type FiscalSummary } from '@/lib/fiscal/lmnp'
import { listAvailableYears, loadFiscalYear } from '@/lib/fiscal/query'

export interface FiscalPageData {
    summary: FiscalSummary
    availableYears: number[]
    /** Charges de l'année, pour le tableau éditable. */
    expenses: FiscalExpense[]
    properties: { id: string; name: string }[]
}

/**
 * Synthèse fiscale d'une année civile.
 *
 * Type de retour inline plutôt que `ActionResult<T>` : `data` y est optionnel,
 * ce qui obligerait la page à gérer `undefined`. Même choix que
 * `getFinancialStats` — les *getters* renvoient l'inline, les *mutations*
 * `ActionResult`.
 */
export async function getFiscalSummary(
    year: number,
): Promise<{ success: true; data: FiscalPageData } | { success: false; error: string }> {
    try {
        await requireSession()

        const [{ payments, expenses }, availableYears, properties] = await Promise.all([
            loadFiscalYear(year),
            listAvailableYears(year),
            prisma.property.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
        ])

        return {
            success: true,
            data: {
                summary: buildFiscalSummary({ year, payments, expenses }),
                availableYears,
                expenses,
                properties,
            },
        }
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Error building fiscal summary:', error)
        return { success: false, error: 'Impossible de calculer la synthèse fiscale.' }
    }
}
