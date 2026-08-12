import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import { CAF_LAYOUT, type CellSlot, type CheckboxSlot, type TextSlot } from './layout'

/**
 * Remplit la page 1 du Cerfa 10842*07 par superposition.
 * Les autres pages sont laissées strictement intactes.
 */

export interface CafAttestationData {
    // Bailleur
    landlordName: string
    landlordAddress: string
    landlordPhone: string
    landlordFax: string
    landlordEmail: string
    landlordSiret: string

    // Locataires et logement
    tenant1: string
    tenant2: string
    startDate: Date | null
    housingAddress: string
    singleRoom: boolean | null
    surface: number | null
    coTenancy: boolean | null
    coTenantsCount: number | null
    coTenancyTotal: number | null
    furnished: boolean

    // Loyers
    entryMonthLabel: string
    entryRent: number | null
    entryCharges: number | null
    julyYear: number | null
    julyRent: number | null
    julyCharges: number | null

    // Situation
    upToDate: boolean | null
    lastPaidMonth: string
    sublet: boolean | null
    hotel: boolean | null
    directPayment: boolean | null
    decency: boolean | null

    // Signature
    signaturePlace: string
    signatureDate: Date | null
}

const INK = rgb(0.05, 0.1, 0.45)
const BASE_SIZE = 9
const MIN_SIZE = 5.5

/**
 * Les polices standard PDF sont encodées en WinAnsi : une apostrophe courbe ou
 * une espace insécable ferait échouer le rendu. On les ramène à leur
 * équivalent ASCII.
 */
export function sanitize(value: string): string {
    return value
        .replace(/[‘’‛]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/…/g, '...')
        .replace(/[   ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Montant à la française, sans symbole : le formulaire imprime déjà « € ». */
export function formatAmount(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return ''
    return value.toFixed(2).replace('.', ',')
}

function drawText(
    page: PDFPage,
    font: PDFFont,
    slot: TextSlot,
    rawValue: string,
    { align = 'left' }: { align?: 'left' | 'right' } = {},
) {
    const value = sanitize(rawValue)
    if (!value) return

    // Réduction progressive pour tenir dans la zone pointillée du formulaire.
    let size = BASE_SIZE
    while (size > MIN_SIZE && font.widthOfTextAtSize(value, size) > slot.width) {
        size -= 0.25
    }

    let text = value
    if (font.widthOfTextAtSize(text, size) > slot.width) {
        while (text.length > 1 && font.widthOfTextAtSize(`${text}…`, size) > slot.width) {
            text = text.slice(0, -1)
        }
        text = `${text}.`
    }

    const width = font.widthOfTextAtSize(text, size)
    const x = align === 'right' ? slot.x + slot.width - width : slot.x

    page.drawText(text, { x, y: slot.y, size, font, color: INK })
}

/** Écrit un caractère par case, centré. Le surplus éventuel est ignoré. */
function drawCells(page: PDFPage, font: PDFFont, slot: CellSlot, rawValue: string) {
    const value = sanitize(rawValue).replace(/\s/g, '')
    if (!value) return

    value
        .slice(0, slot.xs.length)
        .split('')
        .forEach((char, index) => {
            const width = font.widthOfTextAtSize(char, BASE_SIZE)
            page.drawText(char, {
                x: slot.xs[index] + (slot.cellWidth - width) / 2,
                y: slot.y,
                size: BASE_SIZE,
                font,
                color: INK,
            })
        })
}

/** Trace une croix dans une case à cocher. */
function drawCheck(page: PDFPage, box: CheckboxSlot) {
    const inset = 2.2
    const left = box.x + inset
    const right = box.x + box.size - inset
    const bottom = box.y + inset
    const top = box.y + box.size - inset
    const options = { thickness: 1.1, color: INK }

    page.drawLine({ start: { x: left, y: bottom }, end: { x: right, y: top }, ...options })
    page.drawLine({ start: { x: left, y: top }, end: { x: right, y: bottom }, ...options })
}

/** Coche « oui » ou « non ». Une valeur `null` laisse la rubrique vierge. */
function drawChoice(
    page: PDFPage,
    value: boolean | null | undefined,
    yes: CheckboxSlot,
    no: CheckboxSlot,
) {
    if (value === true) drawCheck(page, yes)
    else if (value === false) drawCheck(page, no)
}

const pad2 = (value: number) => String(value).padStart(2, '0')

/** « JJMMAAAA » : un chiffre par case. */
function formatDateCells(date: Date): string {
    return `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${date.getFullYear()}`
}

export async function fillCafAttestation(
    formBytes: Uint8Array,
    data: CafAttestationData,
): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(formBytes)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const page = pdf.getPage(0)

    const L = CAF_LAYOUT

    // --- Bailleur -------------------------------------------------------
    drawText(page, font, L.landlordName, data.landlordName)
    drawText(page, font, L.landlordAddress, data.landlordAddress)
    drawCells(page, font, L.landlordPhone, data.landlordPhone.replace(/\D/g, ''))
    drawCells(page, font, L.landlordFax, data.landlordFax.replace(/\D/g, ''))
    drawText(page, font, L.landlordSiret, data.landlordSiret)

    // L'adresse électronique est coupée par le « @ » pré-imprimé.
    const [emailLocal, emailDomain] = data.landlordEmail.split('@')
    drawText(page, font, L.landlordEmailLocal, emailLocal ?? '', { align: 'right' })
    drawText(page, font, L.landlordEmailDomain, emailDomain ?? '')

    // --- Locataires -----------------------------------------------------
    drawText(page, font, L.tenant1, data.tenant1)
    drawText(page, font, L.tenant2, data.tenant2)

    if (data.startDate) drawCells(page, font, L.startDate, formatDateCells(data.startDate))

    // --- Logement -------------------------------------------------------
    const address = sanitize(data.housingAddress)
    const split = splitAddress(address, font, L.housingAddressLine1.width)
    drawText(page, font, L.housingAddressLine1, split.first)
    drawText(page, font, L.housingAddressLine2, split.rest)

    drawChoice(page, data.singleRoom, L.singleRoomYes, L.singleRoomNo)
    if (data.surface !== null && Number.isFinite(data.surface)) {
        drawCells(page, font, L.surface, String(Math.round(data.surface)))
    }

    drawChoice(page, data.coTenancy, L.coTenancyYes, L.coTenancyNo)
    if (data.coTenancy && data.coTenantsCount) {
        drawCells(page, font, L.coTenantsCount, String(data.coTenantsCount))
        drawText(page, font, L.coTenancyTotal, formatAmount(data.coTenancyTotal), {
            align: 'right',
        })
    }

    // --- Loyers ---------------------------------------------------------
    drawText(page, font, L.entryMonth, data.entryMonthLabel)
    drawRentLine(page, font, data.furnished, {
        rent: L.entryRent,
        charges: L.entryCharges,
        furnished: L.entryFurnishedTotal,
    }, data.entryRent, data.entryCharges)

    if (data.julyYear) drawCells(page, font, L.julyYear, String(data.julyYear))
    drawRentLine(page, font, data.furnished, {
        rent: L.julyRent,
        charges: L.julyCharges,
        furnished: L.julyFurnishedTotal,
    }, data.julyRent, data.julyCharges)

    // --- Situation ------------------------------------------------------
    drawChoice(page, data.upToDate, L.upToDateYes, L.upToDateNo)
    if (data.upToDate === false) drawText(page, font, L.lastPaidMonth, data.lastPaidMonth)
    drawChoice(page, data.sublet, L.subletYes, L.subletNo)
    drawChoice(page, data.hotel, L.hotelYes, L.hotelNo)
    drawChoice(page, data.directPayment, L.directPaymentYes, L.directPaymentNo)
    drawChoice(page, data.decency, L.decencyYes, L.decencyNo)

    // --- Signature ------------------------------------------------------
    drawText(page, font, L.signaturePlace, data.signaturePlace)
    if (data.signatureDate) {
        drawCells(page, font, L.signatureDate, formatDateCells(data.signatureDate))
    }

    return pdf.save()
}

/**
 * Un logement meublé se déclare en montant charges comprises, dans une colonne
 * distincte : les deux premières cases restent alors vides.
 */
function drawRentLine(
    page: PDFPage,
    font: PDFFont,
    furnished: boolean,
    slots: { rent: TextSlot; charges: TextSlot; furnished: TextSlot },
    rent: number | null,
    charges: number | null,
) {
    if (rent === null && charges === null) return

    if (furnished) {
        drawText(page, font, slots.furnished, formatAmount((rent ?? 0) + (charges ?? 0)), {
            align: 'right',
        })
        return
    }

    drawText(page, font, slots.rent, formatAmount(rent), { align: 'right' })
    drawText(page, font, slots.charges, formatAmount(charges), { align: 'right' })
}

/**
 * L'adresse du logement démarre en fin de ligne puis se poursuit sur la ligne
 * suivante, pleine largeur : on coupe à la dernière espace qui tient.
 */
function splitAddress(address: string, font: PDFFont, firstWidth: number) {
    if (!address) return { first: '', rest: '' }
    if (font.widthOfTextAtSize(address, BASE_SIZE) <= firstWidth) {
        return { first: address, rest: '' }
    }

    const words = address.split(' ')
    let first = ''
    let index = 0
    while (index < words.length) {
        const candidate = first ? `${first} ${words[index]}` : words[index]
        if (font.widthOfTextAtSize(candidate, BASE_SIZE) > firstWidth) break
        first = candidate
        index += 1
    }

    return { first, rest: words.slice(index).join(' ') }
}
