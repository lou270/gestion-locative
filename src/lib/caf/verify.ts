import { inflateSync } from 'zlib'
import { PDFArray, PDFDocument, PDFName, PDFRawStream, PDFRef } from 'pdf-lib'
import {
    CAF_FINGERPRINT_CHECKBOXES,
    CHECKBOX_SIZE,
    PAGE_HEIGHT,
    PAGE_WIDTH,
} from './layout'

/**
 * Vérifie que le PDF téléversé est bien le Cerfa 10842*07.
 *
 * Le remplissage superpose du texte à des coordonnées figées : appliqué à un
 * autre formulaire (ou à un autre millésime), il inscrirait les informations
 * en face des mauvaises rubriques, sur un document transmis à la CAF. On
 * refuse donc tout document dont la disposition ne correspond pas.
 *
 * L'empreinte retenue est la position des 19 cases à cocher de la page 1,
 * lisible directement dans le flux de contenu — sans dépendre d'un moteur
 * d'extraction de texte.
 */

/** Tolérance de position, en points. */
const POSITION_TOLERANCE = 1.5
const SIZE_TOLERANCE = 1.5

export type VerifyResult = { ok: true } | { ok: false; reason: string }

export function decodeContentStream(pdf: PDFDocument, pageIndex: number): string {
    const page = pdf.getPage(pageIndex)
    const contents = page.node.get(PDFName.of('Contents'))

    const refs: PDFRef[] = []
    const collect = (value: unknown) => {
        if (value instanceof PDFRef) {
            const resolved = pdf.context.lookup(value)
            if (resolved instanceof PDFArray) resolved.asArray().forEach(collect)
            else refs.push(value)
        } else if (value instanceof PDFArray) {
            value.asArray().forEach(collect)
        }
    }
    collect(contents)

    const chunks: Buffer[] = []
    for (const ref of refs) {
        const stream = pdf.context.lookup(ref)
        if (!(stream instanceof PDFRawStream)) continue
        const raw = Buffer.from(stream.getContents())
        try {
            chunks.push(inflateSync(raw))
        } catch {
            chunks.push(raw)
        }
    }

    return Buffer.concat(chunks).toString('latin1')
}

/**
 * Facteur d'échelle appliqué au flux : le générateur du Cerfa travaille en
 * millièmes et pose un `0.24 0 0 0.24 0 0 cm` en tête. Sans lecture de cette
 * matrice, les coordonnées relevées seraient inexploitables.
 */
export function detectScale(content: string): number {
    const match = /([\d.]+)\s+0\s+0\s+([\d.]+)\s+0\s+0\s+cm/.exec(content)
    if (!match) return 1
    const scale = Number(match[1])
    return Number.isFinite(scale) && scale > 0 ? scale : 1
}

/** Rectangles `x y w h re` d'un flux de contenu, ramenés en points. */
export function extractRectangles(content: string, scale: number): number[][] {
    return [...content.matchAll(/(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+re/g)].map(
        (match) => match.slice(1, 5).map((value) => Number(value) * scale),
    )
}

export async function verifyCafForm(bytes: Uint8Array): Promise<VerifyResult> {
    let pdf: PDFDocument
    try {
        pdf = await PDFDocument.load(bytes)
    } catch {
        return { ok: false, reason: 'Le fichier n’est pas un PDF lisible (ou il est protégé).' }
    }

    // `PDFDocument.load` accepte un fichier tronqué dont le catalogue est
    // inexploitable : la lecture des pages lève alors, et non le chargement.
    let width: number
    let height: number
    let content: string
    try {
        if (pdf.getPageCount() < 1) {
            return { ok: false, reason: 'Le PDF ne contient aucune page.' }
        }

        const page = pdf.getPage(0)
        width = Math.round(page.getWidth())
        height = Math.round(page.getHeight())
        content = decodeContentStream(pdf, 0)
    } catch {
        return {
            ok: false,
            reason: 'Le PDF est illisible : sa première page n’a pas pu être analysée.',
        }
    }

    if (Math.abs(width - PAGE_WIDTH) > 2 || Math.abs(height - PAGE_HEIGHT) > 2) {
        return {
            ok: false,
            reason: `La première page n’est pas au format A4 portrait (${width} × ${height} pt).`,
        }
    }

    const scale = detectScale(content)
    const boxes = extractRectangles(content, scale).filter(
        (rect) =>
            Math.abs(rect[2] - CHECKBOX_SIZE.width) < SIZE_TOLERANCE &&
            Math.abs(rect[3] - CHECKBOX_SIZE.height) < SIZE_TOLERANCE,
    )

    const missing = CAF_FINGERPRINT_CHECKBOXES.filter(
        ([x, y]) =>
            !boxes.some(
                ([bx, by]) =>
                    Math.abs(bx - x) < POSITION_TOLERANCE &&
                    Math.abs(by - y) < POSITION_TOLERANCE,
            ),
    )

    if (missing.length > 0) {
        return {
            ok: false,
            reason:
                'Ce document ne correspond pas au Cerfa 10842*07 « Attestation de loyer » ' +
                `(${missing.length} rubrique(s) sur ${CAF_FINGERPRINT_CHECKBOXES.length} ` +
                'introuvable(s) à l’emplacement attendu). Vérifiez que vous téléversez bien le ' +
                'formulaire reçu de la CAF, sans l’avoir modifié ni ré-imprimé.',
        }
    }

    return { ok: true }
}
