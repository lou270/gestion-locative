/**
 * Utilitaires de dates.
 *
 * Toute la logique de loyer raisonne en dates *locales* (`getDate()`,
 * `getMonth()`...). Or `new Date("2026-01-15")` est interprété en UTC : à
 * minuit UTC, un fuseau négatif retombe sur le 14. On normalise donc les dates
 * saisies à midi local, ce qui les rend insensibles au décalage horaire.
 */

/** Convertit la valeur d'un <input type="date"> en Date locale (midi). */
export function parseDateInput(value: unknown): Date | null {
    if (typeof value !== 'string') return null
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
    if (!match) {
        const fallback = new Date(value as string)
        return isNaN(fallback.getTime()) ? null : fallback
    }
    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0)
    return isNaN(date.getTime()) ? null : date
}

/** Formate une Date pour un <input type="date"> sans décalage de fuseau. */
export function toDateInputValue(date: Date | string | null | undefined): string {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0)
}

export function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0)
}

export function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Nombre de mois de `from` à `to` inclus (0 si `to` est avant `from`). */
export function monthsBetween(from: Date, to: Date): number {
    const diff = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
    return diff < 0 ? 0 : diff + 1
}

/**
 * Résout les paramètres `?month=&year=` d'une URL en 1er du mois demandé.
 * Retombe sur le mois courant si les paramètres sont absents ou aberrants.
 */
export function resolveMonthParam(
    month: string | null,
    year: string | null,
    fallback: Date = new Date(),
): Date {
    const m = Number(month)
    const y = Number(year)
    if (Number.isInteger(m) && m >= 1 && m <= 12 && Number.isInteger(y) && y >= 2000 && y <= 2100) {
        return new Date(y, m - 1, 1, 12, 0, 0, 0)
    }
    return startOfMonth(fallback)
}

export const MIN_YEAR = 2000
export const MAX_YEAR = 2100

/**
 * Résout le paramètre `?year=` d'une URL. Retombe sur l'année courante si le
 * paramètre est absent ou aberrant. Pendant de `resolveMonthParam`.
 *
 * Le type accepte `null` (retour de `URLSearchParams.get`) comme `undefined`
 * (les `searchParams` d'une page), pour servir les deux appelants.
 */
export function resolveYearParam(
    year: string | null | undefined,
    fallback: Date = new Date(),
): number {
    const y = Number(year)
    if (
        year !== null &&
        year !== undefined &&
        String(year).trim() !== '' &&
        Number.isInteger(y) &&
        y >= MIN_YEAR &&
        y <= MAX_YEAR
    ) {
        return y
    }
    return fallback.getFullYear()
}

/**
 * Bornes d'une année civile, pour un `where` Prisma.
 *
 * Borne haute exclusive : `lte: 31 décembre` à minuit excluait les
 * enregistrements du dernier jour de l'année (même écueil que dans
 * `getFinancialStats`).
 *
 * Bornes à minuit et non à midi : les dates saisies sont normalisées à midi
 * local, mais une donnée importée peut être à minuit. Des bornes à minuit
 * couvrent l'année entière quelle que soit l'heure enregistrée.
 */
export function yearRange(year: number): { gte: Date; lt: Date } {
    return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
}

/** Décale une date de `offset` mois, en restant au 1er du mois. */
export function addMonths(date: Date, offset: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12, 0, 0, 0)
}
