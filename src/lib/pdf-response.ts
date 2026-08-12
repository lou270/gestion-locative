import type { ReactElement } from 'react'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'

/**
 * Nettoie un nom de fichier destiné à l'en-tête `Content-Disposition`.
 * Un nom de locataire contenant un guillemet, un retour à la ligne ou un
 * accent casserait l'en-tête (voire permettrait d'y injecter des directives).
 */
export function safeFilename(value: string, fallback = 'document'): string {
    const ascii = value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return ascii || fallback
}

/** Rend un document react-pdf et le renvoie en pièce jointe. */
export async function pdfResponse(
    document: ReactElement,
    filename: string,
    { inline = false }: { inline?: boolean } = {},
): Promise<NextResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(document as any)
    const disposition = inline ? 'inline' : 'attachment'

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${disposition}; filename="${safeFilename(filename)}.pdf"`,
            'Cache-Control': 'no-store',
        },
    })
}
