/**
 * Renvoi d'un fichier CSV en pièce jointe. Frère de `pdf-response.ts`.
 *
 * La sérialisation elle-même vit dans `csv.ts`, module pur : ce fichier importe
 * `next/server` et n'est donc utilisable que depuis un route handler.
 */

import { NextResponse } from 'next/server'
import { CSV_BOM } from './csv'
import { safeFilename } from './filename'

/** Renvoie un corps CSV en pièce jointe, précédé du BOM UTF-8. */
export function csvResponse(csv: string, filename: string): NextResponse {
    return new NextResponse(CSV_BOM + csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${safeFilename(filename)}.csv"`,
            'Cache-Control': 'no-store',
        },
    })
}
