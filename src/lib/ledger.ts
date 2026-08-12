/**
 * Logique comptable d'un dossier locataire.
 *
 * Source de vérité unique partagée par la page locataire, le dashboard et les
 * routes PDF (quittance / avis d'échéance), qui recalculaient chacune leur
 * propre solde avec des règles divergentes.
 *
 * Règles métier :
 *  - le dépôt de garantie (`Depot`) n'est pas un loyer : il n'entre jamais dans
 *    le solde dû / payé, il est suivi séparément ;
 *  - l'allocation logement (`CAF`) est un règlement du loyer effectué par la
 *    CAF pour le compte du locataire : elle compte comme payée ;
 *  - un paiement est rattaché à un mois par sa `periodStart`, pas par sa date
 *    d'encaissement.
 */

import { calculateProrata, calculateTotalDueUntilDate } from './calculations'
import { endOfMonth, isSameMonth, startOfMonth } from './dates'

export const DEPOSIT_TYPE = 'Depot'
export const CAF_TYPE = 'CAF'

export const PAYMENT_TYPES = ['Loyer', 'CAF', 'Regularisation', 'Depot'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
    Loyer: 'Loyer',
    CAF: 'CAF (allocation logement)',
    Regularisation: 'Régularisation de charges',
    Depot: 'Dépôt de garantie',
}

/** Tolérance sur les comparaisons de montants (arrondis flottants). */
export const EPSILON = 0.01

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid'

export interface LedgerPayment {
    id?: string
    amount: number
    date: Date | string
    periodStart: Date | string
    periodEnd?: Date | string
    typology: string
}

export interface LedgerTenant {
    rentAmount: number
    chargeAmount: number
    startDate: Date | string
    endDate?: Date | string | null
}

export interface MonthLedger<P extends LedgerPayment = LedgerPayment> {
    date: Date
    totalDue: number
    totalPaid: number
    /** Part réglée par la CAF, incluse dans `totalPaid`. */
    cafAmount: number
    remaining: number
    status: PaymentStatus
    payments: P[]
}

export interface TenantBalance {
    /** Loyers + charges dus depuis l'entrée jusqu'à `asOf` (inclus). */
    totalDue: number
    /** Encaissements imputés au loyer (dépôt de garantie exclu). */
    totalPaid: number
    /** Dépôt de garantie encaissé. */
    deposit: number
    /** `totalPaid - totalDue` : négatif = impayé, positif = avance. */
    balance: number
}

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value))

export function isDeposit(payment: Pick<LedgerPayment, 'typology'>): boolean {
    return payment.typology === DEPOSIT_TYPE
}

/** Un encaissement qui vient en déduction du loyer dû. */
export function isRentPayment(payment: Pick<LedgerPayment, 'typology'>): boolean {
    return !isDeposit(payment)
}

export function sumAmounts(payments: Pick<LedgerPayment, 'amount'>[]): number {
    return round(payments.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0))
}

export function round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Répartit un montant dû entre loyer et charges au prorata du bail.
 * Protège contre le cas loyer = charges = 0 (division par zéro → NaN au PDF).
 */
export function splitRentAndCharge(
    total: number,
    rentAmount: number,
    chargeAmount: number,
): { rent: number; charge: number } {
    const base = rentAmount + chargeAmount
    if (total <= 0) return { rent: 0, charge: 0 }
    if (base <= 0) return { rent: round(total), charge: 0 }
    const rent = round(total * (rentAmount / base))
    return { rent, charge: round(total - rent) }
}

/** Paiements rattachés au mois de `monthDate` (via `periodStart`). */
export function paymentsForMonth<P extends LedgerPayment>(payments: P[], monthDate: Date): P[] {
    return payments.filter((p) => isSameMonth(toDate(p.periodStart), monthDate))
}

/** Somme des allocations CAF imputées à un mois donné. */
export function cafAmountForMonth(payments: LedgerPayment[], monthDate: Date): number {
    return sumAmounts(paymentsForMonth(payments, monthDate).filter((p) => p.typology === CAF_TYPE))
}

export function statusFor(totalDue: number, totalPaid: number): PaymentStatus {
    if (totalPaid >= totalDue - EPSILON) return 'Paid'
    if (totalPaid > 0) return 'Partial'
    return 'Unpaid'
}

/**
 * Situation d'un mois. Retourne `null` si rien n'est dû (avant l'entrée dans
 * les lieux ou après la sortie).
 */
export function getMonthLedger<P extends LedgerPayment>(
    tenant: LedgerTenant,
    payments: P[],
    monthDate: Date,
): MonthLedger<P> | null {
    const startDate = toDate(tenant.startDate)
    const endDate = tenant.endDate ? toDate(tenant.endDate) : null

    const totalDue = calculateProrata(
        tenant.rentAmount,
        tenant.chargeAmount,
        monthDate,
        startDate,
        endDate,
    )
    if (totalDue === 0) return null

    const monthPayments = paymentsForMonth(payments, monthDate).filter(isRentPayment)
    const totalPaid = sumAmounts(monthPayments)
    const cafAmount = sumAmounts(monthPayments.filter((p) => p.typology === CAF_TYPE))

    return {
        date: monthDate,
        totalDue,
        totalPaid,
        cafAmount,
        remaining: round(Math.max(totalDue - totalPaid, 0)),
        status: statusFor(totalDue, totalPaid),
        payments: monthPayments,
    }
}

/**
 * Historique mois par mois, du plus récent au plus ancien.
 * `monthsAhead` permet d'afficher l'échéance à venir (avis d'échéance).
 */
export function buildPaymentHistory<P extends LedgerPayment>(
    tenant: LedgerTenant,
    payments: P[],
    options: { monthsAhead?: number; now?: Date } = {},
): MonthLedger<P>[] {
    const { monthsAhead = 1, now = new Date() } = options
    const startDate = toDate(tenant.startDate)

    const last = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1, 12)
    const count =
        (last.getFullYear() - startDate.getFullYear()) * 12 +
        (last.getMonth() - startDate.getMonth()) +
        1

    const history: MonthLedger<P>[] = []
    for (let i = 0; i < Math.max(count, 1); i++) {
        const month = new Date(last.getFullYear(), last.getMonth() - i, 1, 12)
        const ledger = getMonthLedger(tenant, payments, month)
        if (ledger) history.push(ledger)
    }
    return history
}

/** Solde global du dossier à une date donnée. */
export function getTenantBalance(
    tenant: LedgerTenant,
    payments: LedgerPayment[],
    asOf: Date = new Date(),
): TenantBalance {
    const startDate = toDate(tenant.startDate)
    const endDate = tenant.endDate ? toDate(tenant.endDate) : null

    const totalDue = calculateTotalDueUntilDate(
        tenant.rentAmount,
        tenant.chargeAmount,
        startDate,
        asOf,
        endDate,
    )
    const totalPaid = sumAmounts(payments.filter(isRentPayment))
    const deposit = sumAmounts(payments.filter(isDeposit))

    return { totalDue, totalPaid, deposit, balance: round(totalPaid - totalDue) }
}

/**
 * Solde reporté à l'ouverture du mois `monthDate` : dû cumulé jusqu'à la fin du
 * mois précédent, moins les seuls règlements imputés à ces mois-là.
 *
 * Les paiements rattachés au mois courant ou à des mois futurs sont exclus,
 * sans quoi une avance de trésorerie serait comptée deux fois.
 */
export function getCarriedBalance(
    tenant: LedgerTenant,
    payments: LedgerPayment[],
    monthDate: Date,
): number {
    const startDate = toDate(tenant.startDate)
    const endDate = tenant.endDate ? toDate(tenant.endDate) : null
    const firstOfMonth = startOfMonth(monthDate)

    const endOfPreviousMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0, 12)
    if (endOfPreviousMonth < startDate) return 0

    const dueBefore = calculateTotalDueUntilDate(
        tenant.rentAmount,
        tenant.chargeAmount,
        startDate,
        endOfPreviousMonth,
        endDate,
    )
    const paidBefore = sumAmounts(
        payments.filter((p) => isRentPayment(p) && toDate(p.periodStart) < firstOfMonth),
    )

    return round(paidBefore - dueBefore)
}

/**
 * Une quittance ne peut être émise que si le mois concerné est intégralement
 * réglé et qu'aucun arriéré antérieur ne subsiste.
 */
export function canIssueReceipt(
    tenant: LedgerTenant,
    payments: LedgerPayment[],
    monthDate: Date,
): { ok: true } | { ok: false; totalDue: number; totalPaid: number } {
    const startDate = toDate(tenant.startDate)
    const endDate = tenant.endDate ? toDate(tenant.endDate) : null

    const totalDue = calculateTotalDueUntilDate(
        tenant.rentAmount,
        tenant.chargeAmount,
        startDate,
        endOfMonth(monthDate),
        endDate,
    )
    const totalPaid = sumAmounts(
        payments.filter(
            (p) => isRentPayment(p) && toDate(p.periodStart) <= endOfMonth(monthDate),
        ),
    )

    if (totalPaid < totalDue - EPSILON) return { ok: false, totalDue, totalPaid }
    return { ok: true }
}
