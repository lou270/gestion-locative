import { NextRequest } from 'next/server'
import { guardApiRoute } from '@/lib/api-guard'
import { csvResponse } from '@/lib/csv-response'
import { toCsv } from '@/lib/csv'
import { resolveYearParam } from '@/lib/dates'
import { buildFiscalCsvRows, FISCAL_CSV_HEADERS } from '@/lib/fiscal/csv'
import { loadFiscalYear } from '@/lib/fiscal/query'

export const runtime = 'nodejs'

/**
 * Journal de trésorerie d'une année civile, en CSV.
 *
 * Une ligne par mouvement, recettes et charges mêlées, triées par date. Les
 * charges sont signées négativement : la somme de la colonne « Montant »
 * redonne le résultat au régime réel affiché sur `/fiscal`.
 */
export async function GET(request: NextRequest) {
    // Le matcher de `proxy.ts` exclut `/api` : cette garde est la seule protection.
    const denied = await guardApiRoute()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const year = resolveYearParam(searchParams.get('year'))

    const { payments, expenses } = await loadFiscalYear(year)
    const rows = buildFiscalCsvRows({ payments, expenses })

    return csvResponse(
        toCsv([[...FISCAL_CSV_HEADERS], ...rows]),
        `export-fiscal-lmnp-${year}`,
    )
}
