/**
 * Chargement des mouvements de trésorerie d'une année civile.
 *
 * Partagé par la server action de la page et par la route d'export CSV, pour
 * que le périmètre des données ne diverge jamais entre l'écran et le fichier.
 *
 * Aucune garde d'authentification ici : chaque appelant se garde lui-même
 * (`requireSession` côté action, `guardApiRoute` côté route handler).
 */

import prisma from '@/lib/prisma'
import { yearRange } from '@/lib/dates'
import type { FiscalExpense, FiscalPayment } from './lmnp'

export async function loadFiscalYear(year: number): Promise<{
    payments: FiscalPayment[]
    expenses: FiscalExpense[]
}> {
    const date = yearRange(year)

    const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
            where: { date },
            orderBy: { date: 'asc' },
            select: {
                amount: true,
                date: true,
                typology: true,
                periodStart: true,
                periodEnd: true,
                tenant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        property: { select: { id: true, name: true } },
                    },
                },
            },
        }),
        prisma.expense.findMany({
            where: { date },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                amount: true,
                date: true,
                category: true,
                label: true,
                note: true,
                property: { select: { id: true, name: true } },
            },
        }),
    ])

    return {
        payments: payments.map((payment) => ({
            amount: payment.amount,
            date: payment.date,
            typology: payment.typology,
            periodStart: payment.periodStart,
            periodEnd: payment.periodEnd,
            tenantId: payment.tenant.id,
            tenantName: `${payment.tenant.lastName} ${payment.tenant.firstName}`.trim(),
            // Attention : le bien vient du rattachement *actuel* du locataire, et
            // non d'un instantané pris au moment du paiement. Réaffecter un
            // locataire — ou supprimer un bien, ce qui remet `propertyId` à null —
            // déplace rétroactivement ses recettes passées vers « Non affecté ».
            // La correction propre serait un `propertyId` figé sur `Payment`.
            propertyId: payment.tenant.property?.id ?? null,
            propertyName: payment.tenant.property?.name ?? null,
        })),
        expenses: expenses.map((expense) => ({
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            category: expense.category,
            label: expense.label,
            note: expense.note,
            propertyId: expense.property?.id ?? null,
            propertyName: expense.property?.name ?? null,
        })),
    }
}

/**
 * Années pour lesquelles il existe au moins un mouvement, ordre décroissant.
 * L'année demandée et l'année courante y figurent toujours : sans elles, le
 * sélecteur n'offrirait aucune destination sur une base vide.
 */
export async function listAvailableYears(requested: number): Promise<number[]> {
    const [firstPayment, firstExpense] = await Promise.all([
        prisma.payment.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
        prisma.expense.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
    ])

    const known = [firstPayment?.date, firstExpense?.date]
        .filter((date): date is Date => date instanceof Date)
        .map((date) => date.getFullYear())

    const currentYear = new Date().getFullYear()
    const earliest = Math.min(currentYear, requested, ...known)
    const latest = Math.max(currentYear, requested)

    const years: number[] = []
    for (let year = latest; year >= earliest; year--) years.push(year)
    return years
}
