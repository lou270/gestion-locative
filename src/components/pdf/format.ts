/**
 * Formatage des valeurs imprimées dans les PDF.
 *
 * `Intl.NumberFormat` n'est pas utilisé ici : il insère une espace fine
 * insécable (U+202F) avant le symbole monétaire, absente de l'encodage WinAnsi
 * des polices standard PDF — le caractère serait perdu ou remplacé à
 * l'impression.
 */

/** « 680,00 € » */
export function euros(value: number | null | undefined): string {
    const amount = Number.isFinite(value as number) ? (value as number) : 0
    return `${amount.toFixed(2).replace('.', ',')} €`
}

/** « 05/03/2026 » */
export function frDate(value: Date | string | null | undefined): string {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('fr-FR')
}

/** « mars 2026 » */
export function frMonth(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/** Nom d'usage du bailleur : raison sociale si elle existe, sinon état civil. */
export function landlordName(landlord?: {
    companyName?: string | null
    firstName?: string | null
    lastName?: string | null
} | null): string {
    if (!landlord) return ''
    const company = landlord.companyName?.trim()
    if (company) return company
    return [landlord.firstName, landlord.lastName].filter(Boolean).join(' ').trim()
}

/**
 * Élision devant voyelle ou h muet : « d'Alice Bernard », « de Marc Durand ».
 * Le h aspiré n'est pas traité — il ne concerne quasiment aucun prénom, et se
 * tromper dans ce sens est moins visible que « de Alice ».
 */
export function withElision(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return ''
    const first = trimmed.charAt(0).toLowerCase()
    return /[aeiouyâàäéèêëîïôöûüh]/.test(first) ? `d'${trimmed}` : `de ${trimmed}`
}

/**
 * « Fait à Rezé, le 05/03/2026 » — ou simplement « Le 05/03/2026 » si la ville
 * du bailleur n'est pas renseignée. Mieux vaut omettre le lieu que d'en
 * inventer un sur un document remis au locataire.
 */
export function madeAt(city: string | null | undefined, date: Date): string {
    const place = city?.trim()
    return place ? `Fait à ${place}, le ${frDate(date)}` : `Le ${frDate(date)}`
}

/**
 * Phrase de quittancement. Extraite du JSX et exportée pour être testée : les
 * espaces manquants y étaient invisibles jusqu'à l'impression.
 */
export function buildReceiptDeclaration({
    bailleur,
    locataire,
    paidByTenant,
    cafAmount,
    period,
}: {
    bailleur: string
    locataire: string
    paidByTenant: number
    cafAmount: number
    period: { start: Date; end: Date }
}): string {
    return (
        `Je soussigné ${bailleur}, bailleur du logement désigné ci-dessus, déclare avoir reçu ` +
        `${withElision(locataire)} la somme de ${euros(paidByTenant)}` +
        (cafAmount > 0
            ? `, complétée par ${euros(cafAmount)} versés directement par la CAF au titre de l'allocation logement,`
            : '') +
        ` au titre du loyer et des charges pour la période du ${frDate(period.start)} au ${frDate(period.end)}, ` +
        `et lui en donne quittance sous réserve de tous mes droits.`
    )
}
