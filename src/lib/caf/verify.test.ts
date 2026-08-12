/**
 * @jest-environment node
 */
import { PDFDocument, PDFNumber, PDFOperator, PDFOperatorNames } from 'pdf-lib'
import { CAF_FINGERPRINT_CHECKBOXES, CHECKBOX_SIZE } from './layout'
import { detectScale, extractRectangles, verifyCafForm } from './verify'

/** Échelle utilisée par le générateur du Cerfa réel. */
const SCALE = 0.24

/**
 * Le Cerfa réel est nominatif (matricule et code-barres du locataire) : il
 * n'est pas versé au dépôt. On reconstruit donc un document à la même
 * disposition **et au même encodage** — matrice d'échelle en tête puis
 * opérateurs `re` en coordonnées non mises à l'échelle.
 */
async function buildFakeCerfa({
    omitCheckboxes = 0,
    pageSize = [595, 842] as [number, number],
} = {}) {
    const pdf = await PDFDocument.create()
    const page = pdf.addPage(pageSize)

    const boxes = CAF_FINGERPRINT_CHECKBOXES.slice(
        0,
        CAF_FINGERPRINT_CHECKBOXES.length - omitCheckboxes,
    )

    const numbers = (values: number[]) => values.map((value) => PDFNumber.of(value))

    const operators = [
        PDFOperator.of(
            PDFOperatorNames.ConcatTransformationMatrix,
            numbers([SCALE, 0, 0, SCALE, 0, 0]),
        ),
        ...boxes.flatMap(([x, y]) => [
            PDFOperator.of(
                PDFOperatorNames.AppendRectangle,
                numbers([
                    Math.round(x / SCALE),
                    Math.round(y / SCALE),
                    Math.round(CHECKBOX_SIZE.width / SCALE),
                    Math.round(CHECKBOX_SIZE.height / SCALE),
                ]),
            ),
            PDFOperator.of(PDFOperatorNames.StrokePath),
        ]),
    ]

    page.pushOperators(...operators)

    return pdf.save()
}

describe('detectScale', () => {
    it('lit la matrice d’échelle du générateur du Cerfa', () => {
        expect(detectScale('0.24 0 0 0.24 0 0 cm \n0 G')).toBeCloseTo(0.24)
    })

    it('vaut 1 en l’absence de matrice', () => {
        expect(detectScale('0 G 8 w 118 3154 m')).toBe(1)
    })
})

describe('extractRectangles', () => {
    it('ramène les rectangles en points', () => {
        const rects = extractRectangles('1010 2564 42 41 re', 0.24)

        expect(rects[0][0]).toBeCloseTo(242.4)
        expect(rects[0][2]).toBeCloseTo(10.08)
    })
})

describe('verifyCafForm', () => {
    it('accepte un document à la disposition attendue', async () => {
        const result = await verifyCafForm(await buildFakeCerfa())

        expect(result).toEqual({ ok: true })
    })

    it('refuse un PDF quelconque', async () => {
        const pdf = await PDFDocument.create()
        pdf.addPage([595, 842])

        const result = await verifyCafForm(await pdf.save())

        expect(result.ok).toBe(false)
        expect(result.ok === false && result.reason).toContain('10842*07')
    })

    it('refuse un formulaire dont des rubriques ont bougé', async () => {
        const result = await verifyCafForm(await buildFakeCerfa({ omitCheckboxes: 3 }))

        expect(result.ok).toBe(false)
        expect(result.ok === false && result.reason).toContain('3 rubrique(s)')
    })

    it('refuse un document qui n’est pas en A4 portrait', async () => {
        const result = await verifyCafForm(await buildFakeCerfa({ pageSize: [842, 595] }))

        expect(result.ok).toBe(false)
        expect(result.ok === false && result.reason).toContain('A4')
    })

    it('refuse un fichier illisible', async () => {
        const result = await verifyCafForm(new Uint8Array([1, 2, 3, 4]))

        expect(result.ok).toBe(false)
        expect(result.ok === false && result.reason).toContain('PDF')
    })

    it('refuse un PDF tronqué sans planter', async () => {
        // `PDFDocument.load` accepte cet en-tête, mais le catalogue est absent :
        // la lecture des pages lève, ce qui remontait en erreur 500.
        const truncated = new Uint8Array(Buffer.from('%PDF-1.4\n'))

        const result = await verifyCafForm(truncated)

        expect(result.ok).toBe(false)
        expect(result.ok === false && result.reason).toContain('illisible')
    })
})
