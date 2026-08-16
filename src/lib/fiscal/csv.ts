/**
 * Construction du journal de trésorerie exporté en CSV.
 *
 * Fonction pure, sans `NextResponse` : la mise en forme du fichier appartient à
 * `csv-response.ts`, la sélection des données à `query.ts`.
 */

import { formatCsvAmount, type CsvCell } from '../csv'
import { expenseCategoryLabel } from '../expenses'
import { PAYMENT_TYPE_LABELS, isRentPayment } from '../ledger'
import type { FiscalExpense, FiscalPayment } from './lmnp'

export const FISCAL_CSV_HEADERS = [
    'Type',
    'Date',
    'Categorie',
    'Libelle',
    'Bien',
    'Locataire',
    'Periode',
    'Montant',
    'Note',
] as const

const frDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

const frMonth = (date: Date): string =>
    date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })

interface JournalEntry {
    date: Date
    row: CsvCell[]
}

/**
 * Une ligne par mouvement de trésorerie, recettes et charges mêlées, triées par
 * date. Les charges sont signées négativement : la somme de la colonne
 * « Montant » redonne le résultat au régime réel affiché à l'écran.
 *
 * Les dépôts de garantie sont exclus, exactement comme dans le calcul — sinon
 * le fichier et la page se contrediraient.
 */
export function buildFiscalCsvRows(input: {
    payments: FiscalPayment[]
    expenses: FiscalExpense[]
}): CsvCell[][] {
    const entries: JournalEntry[] = []

    for (const payment of input.payments.filter(isRentPayment)) {
        entries.push({
            date: payment.date,
            row: [
                'Recette',
                frDate(payment.date),
                PAYMENT_TYPE_LABELS[payment.typology] ?? payment.typology,
                `Loyer ${frMonth(payment.periodStart)}`,
                payment.propertyName ?? '',
                payment.tenantName,
                `${frDate(payment.periodStart)} - ${frDate(payment.periodEnd)}`,
                formatCsvAmount(payment.amount),
                '',
            ],
        })
    }

    for (const expense of input.expenses) {
        entries.push({
            date: expense.date,
            row: [
                'Charge',
                frDate(expense.date),
                expenseCategoryLabel(expense.category),
                expense.label,
                expense.propertyName ?? '',
                '',
                '',
                formatCsvAmount(-expense.amount),
                expense.note ?? '',
            ],
        })
    }

    return entries
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((entry) => entry.row)
}
