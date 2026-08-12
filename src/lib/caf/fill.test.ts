/**
 * @jest-environment node
 */
import { PDFDocument } from 'pdf-lib'
import { fillCafAttestation, formatAmount, sanitize, type CafAttestationData } from './fill'
import { decodeContentStream } from './verify'

const BASE: CafAttestationData = {
    landlordName: 'SCI Les Oliviers',
    landlordAddress: '5 rue du Port, 44000 Nantes',
    landlordPhone: '06 12 34 56 78',
    landlordFax: '',
    landlordEmail: 'marie.martin@example.com',
    landlordSiret: '12345678901234',
    tenant1: 'Sophie Leroy',
    tenant2: '',
    startDate: new Date(2026, 0, 15, 12),
    housingAddress: '3 impasse des Vignes, 44100 Nantes',
    singleRoom: false,
    surface: 78,
    coTenancy: false,
    coTenantsCount: null,
    coTenancyTotal: null,
    furnished: false,
    entryMonthLabel: 'Janvier 2026',
    entryRent: 890,
    entryCharges: 110,
    julyYear: 2026,
    julyRent: 890,
    julyCharges: 110,
    upToDate: true,
    lastPaidMonth: '',
    sublet: false,
    hotel: false,
    directPayment: null,
    decency: true,
    signaturePlace: 'Nantes',
    signatureDate: new Date(2026, 7, 12, 12),
}

/** Cerfa factice à deux pages : seule la première doit être annotée. */
async function blankForm() {
    const pdf = await PDFDocument.create()
    pdf.addPage([595, 842])
    pdf.addPage([595, 842])
    return pdf.save()
}

/**
 * Texte effectivement écrit dans le flux de contenu d'une page.
 * pdf-lib encode les chaînes en hexadécimal (`<48656C6C6F> Tj`).
 */
async function drawnText(bytes: Uint8Array, pageIndex = 0): Promise<string> {
    const pdf = await PDFDocument.load(bytes)
    const content = decodeContentStream(pdf, pageIndex)

    return [...content.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)]
        .map((match) => Buffer.from(match[1], 'hex').toString('latin1'))
        .join('')
}

describe('sanitize', () => {
    it('ramène les caractères hors WinAnsi à leur équivalent ASCII', () => {
        // Une apostrophe courbe ferait échouer l'encodage de la police standard.
        expect(sanitize('L’impasse — n°1')).toBe("L'impasse - n°1")
    })

    it('réduit les espaces multiples', () => {
        expect(sanitize('  3   rue  des Lilas ')).toBe('3 rue des Lilas')
    })
})

describe('formatAmount', () => {
    it('formate à la française sans symbole', () => {
        expect(formatAmount(890)).toBe('890,00')
    })

    it('rend une chaîne vide pour une valeur absente', () => {
        expect(formatAmount(null)).toBe('')
    })
})

describe('fillCafAttestation', () => {
    it('produit un PDF valide sans altérer le nombre de pages', async () => {
        const filled = await fillCafAttestation(await blankForm(), BASE)
        const pdf = await PDFDocument.load(filled)

        expect(pdf.getPageCount()).toBe(2)
    })

    it('inscrit les informations du bailleur et du locataire', async () => {
        const text = await drawnText(await fillCafAttestation(await blankForm(), BASE))

        expect(text).toContain('SCI Les Oliviers')
        expect(text).toContain('Sophie Leroy')
        expect(text).toContain('890,00')
    })

    it('scinde l’adresse électronique autour du « @ » pré-imprimé', async () => {
        const text = await drawnText(await fillCafAttestation(await blankForm(), BASE))

        expect(text).toContain('marie.martin')
        expect(text).toContain('example.com')
        expect(text).not.toContain('marie.martin@example.com')
    })

    it('laisse la seconde page intacte', async () => {
        const filled = await fillCafAttestation(await blankForm(), BASE)

        expect(await drawnText(filled, 1)).toBe('')
    })

    it('déclare un meublé charges comprises', async () => {
        const text = await drawnText(
            await fillCafAttestation(await blankForm(), {
                ...BASE,
                furnished: true,
                entryRent: 890,
                entryCharges: 110,
            }),
        )

        expect(text).toContain('1000,00')
        expect(text).not.toContain('890,00')
    })

    it('laisse une rubrique vierge quand la réponse n’est pas renseignée', async () => {
        const withAnswer = await fillCafAttestation(await blankForm(), { ...BASE, decency: true })
        const without = await fillCafAttestation(await blankForm(), { ...BASE, decency: null })

        // Une croix de moins : le flux de contenu est plus court.
        expect(without.length).toBeLessThan(withAnswer.length)
    })

    it('n’écrit pas le mois du dernier loyer si le locataire est à jour', async () => {
        const text = await drawnText(
            await fillCafAttestation(await blankForm(), {
                ...BASE,
                upToDate: true,
                lastPaidMonth: 'Juin 2026',
            }),
        )

        expect(text).not.toContain('Juin 2026')
    })

    it('tolère un dossier vide sans planter', async () => {
        const empty: CafAttestationData = {
            ...BASE,
            landlordName: '',
            landlordAddress: '',
            landlordPhone: '',
            landlordEmail: '',
            landlordSiret: '',
            tenant1: '',
            startDate: null,
            housingAddress: '',
            singleRoom: null,
            surface: null,
            coTenancy: null,
            entryMonthLabel: '',
            entryRent: null,
            entryCharges: null,
            julyYear: null,
            julyRent: null,
            julyCharges: null,
            upToDate: null,
            sublet: null,
            hotel: null,
            decency: null,
            signaturePlace: '',
            signatureDate: null,
        }

        await expect(fillCafAttestation(await blankForm(), empty)).resolves.toBeDefined()
    })
})
