import type { ReactElement } from 'react'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { safeFilename } from './filename'

// Réexporté pour les appelants historiques (route CAF notamment).
export { safeFilename }

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
