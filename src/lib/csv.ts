/**
 * Primitives de sérialisation CSV, calibrées pour Excel en régionalisation
 * française : point-virgule comme séparateur et virgule décimale.
 *
 * Module pur, sans `next/server` — la construction de la réponse HTTP vit dans
 * `csv-response.ts`. Sans cette séparation, tout module important un simple
 * formateur embarquerait le runtime serveur de Next.
 */

/** Excel francophone attend le point-virgule comme séparateur de liste. */
export const CSV_SEPARATOR = ';'

/** RFC 4180 : fin de ligne CRLF. */
export const CSV_EOL = '\r\n'

/**
 * Marque d'ordre des octets UTF-8. Sans elle, Excel lit le fichier en ANSI et
 * « Régularisation » devient « RÃ©gularisation ».
 */
export const CSV_BOM = '﻿'

export type CsvCell = string | number | null | undefined

/** Amorces de formule reconnues par les tableurs. */
const FORMULA_START = /^[=+@\t\r]/

/** Un nombre signé, éventuellement à virgule décimale : « -1240,00 ». */
const PLAIN_NUMBER = /^-?\d+(?:[.,]\d+)?$/

/**
 * Un champ commençant par `=`, `+`, `-` ou `@` est évalué comme une formule à
 * l'ouverture du tableur. On le neutralise par une apostrophe.
 *
 * Exception indispensable : un montant négatif commence lui aussi par `-`.
 * Préfixer « -1240,00 » le transformerait en texte et casserait la somme de la
 * colonne. Les nombres purs sont donc laissés intacts.
 */
function neutralizeFormula(value: string): string {
    if (PLAIN_NUMBER.test(value)) return value
    return FORMULA_START.test(value) || value.startsWith('-') ? `'${value}` : value
}

/** Encadre de guillemets dès que le champ contient un caractère significatif. */
export function escapeCsvField(value: CsvCell): string {
    if (value === null || value === undefined) return ''

    const raw = typeof value === 'number' ? String(value) : neutralizeFormula(value)
    if (raw === '') return ''

    const mustQuote =
        raw.includes(CSV_SEPARATOR) ||
        raw.includes('"') ||
        raw.includes('\n') ||
        raw.includes('\r')

    return mustQuote ? `"${raw.replace(/"/g, '""')}"` : raw
}

/** « 1234.5 » → « 1234,50 » : sans virgule décimale, Excel lit du texte. */
export function formatCsvAmount(value: number): string {
    return (Number.isFinite(value) ? value : 0).toFixed(2).replace('.', ',')
}

/** Assemble des lignes déjà ordonnées en un corps CSV. */
export function toCsv(rows: CsvCell[][]): string {
    return rows.map((row) => row.map(escapeCsvField).join(CSV_SEPARATOR)).join(CSV_EOL)
}
