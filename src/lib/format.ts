/** Formatage cohérent des montants et des dates dans toute l'application. */

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
})

export function formatCurrency(amount: number | null | undefined): string {
    return currencyFormatter.format(Number.isFinite(amount as number) ? (amount as number) : 0)
}

/** Montant signé, avec un « + » explicite pour les crédits. */
export function formatSignedCurrency(amount: number): string {
    const value = Number.isFinite(amount) ? amount : 0
    return `${value > 0 ? '+' : ''}${currencyFormatter.format(value)}`
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatLongDate(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** « Janvier 2026 » */
export function formatMonthYear(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '—'
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
}

export function initials(firstName?: string | null, lastName?: string | null): string {
    return `${(firstName ?? '').charAt(0)}${(lastName ?? '').charAt(0)}`.toUpperCase() || '?'
}
