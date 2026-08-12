import { z } from 'zod'
import type { CafAttestationData } from './fill'

/**
 * Une rubrique absente du formulaire vaut « non renseignée » : la génération
 * ne doit pas échouer pour autant, le champ reste simplement vierge sur le
 * document.
 */
const blank = (value: unknown) => (value === undefined || value === null ? '' : value)

/** Champ « oui / non / non renseigné » du Cerfa. */
const triState = z.preprocess(
    blank,
    z.enum(['oui', 'non', '']).transform((value) => {
        if (value === 'oui') return true
        if (value === 'non') return false
        return null
    }),
)

const optionalAmount = z.preprocess(
    blank,
    z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value.replace(/\s/g, '').replace(',', '.'))))
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
        message: 'Montant invalide.',
    }),
)

const optionalInt = z.preprocess(
    blank,
    z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value)))
    .refine((value) => value === null || (Number.isInteger(value) && value >= 0), {
        message: 'Nombre invalide.',
    }),
)

const optionalDate = z.preprocess(
    blank,
    z
    .string()
    .trim()
    .transform((value) => {
        if (!value) return null
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
        if (!match) return null
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
    }),
)

const text = (max = 200) => z.preprocess(blank, z.string().trim().max(max))

/**
 * Payload envoyé par le formulaire de génération. Tout est facultatif : une
 * rubrique laissée vide reste vierge sur le document, ce qui vaut mieux qu'une
 * valeur inventée sur une déclaration transmise à la CAF.
 */
export const cafAttestationSchema = z.object({
    landlordName: text(),
    landlordAddress: text(),
    landlordPhone: text(30),
    landlordFax: text(30),
    landlordEmail: text(120),
    landlordSiret: text(30),

    tenant1: text(120),
    tenant2: text(120),
    startDate: optionalDate,
    housingAddress: text(300),

    singleRoom: triState,
    surface: optionalAmount,
    coTenancy: triState,
    coTenantsCount: optionalInt,
    coTenancyTotal: optionalAmount,
    furnished: z.preprocess(
        (value) => (value === undefined || value === null ? 'non' : value),
        z.enum(['oui', 'non']).transform((value) => value === 'oui'),
    ),

    entryMonthLabel: text(60),
    entryRent: optionalAmount,
    entryCharges: optionalAmount,
    julyYear: optionalInt,
    julyRent: optionalAmount,
    julyCharges: optionalAmount,

    upToDate: triState,
    lastPaidMonth: text(60),
    sublet: triState,
    hotel: triState,
    directPayment: triState,
    decency: triState,

    signaturePlace: text(80),
    signatureDate: optionalDate,
})

/** Garantit que le schéma produit exactement la forme attendue par `fillCafAttestation`. */
export type CafAttestationParsed = z.infer<typeof cafAttestationSchema>
const _typeCheck: CafAttestationParsed extends CafAttestationData ? true : never = true
void _typeCheck

export type CafAttestationInput = z.input<typeof cafAttestationSchema>

/** Convertit les valeurs pré-remplies en valeurs de formulaire (chaînes). */
export function toFormValues(data: CafAttestationData): Record<string, string> {
    const tri = (value: boolean | null) => (value === true ? 'oui' : value === false ? 'non' : '')
    const num = (value: number | null) => (value === null ? '' : String(value))
    const date = (value: Date | null) =>
        value
            ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
                  value.getDate(),
              ).padStart(2, '0')}`
            : ''

    return {
        landlordName: data.landlordName,
        landlordAddress: data.landlordAddress,
        landlordPhone: data.landlordPhone,
        landlordFax: data.landlordFax,
        landlordEmail: data.landlordEmail,
        landlordSiret: data.landlordSiret,
        tenant1: data.tenant1,
        tenant2: data.tenant2,
        startDate: date(data.startDate),
        housingAddress: data.housingAddress,
        singleRoom: tri(data.singleRoom),
        surface: num(data.surface),
        coTenancy: tri(data.coTenancy),
        coTenantsCount: num(data.coTenantsCount),
        coTenancyTotal: num(data.coTenancyTotal),
        furnished: data.furnished ? 'oui' : 'non',
        entryMonthLabel: data.entryMonthLabel,
        entryRent: num(data.entryRent),
        entryCharges: num(data.entryCharges),
        julyYear: num(data.julyYear),
        julyRent: num(data.julyRent),
        julyCharges: num(data.julyCharges),
        upToDate: tri(data.upToDate),
        lastPaidMonth: data.lastPaidMonth,
        sublet: tri(data.sublet),
        hotel: tri(data.hotel),
        directPayment: tri(data.directPayment),
        decency: tri(data.decency),
        signaturePlace: data.signaturePlace,
        signatureDate: date(data.signatureDate),
    }
}
