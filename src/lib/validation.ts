/**
 * Schémas de validation des formulaires (côté serveur).
 *
 * Les server actions lisaient directement le FormData : un montant vide
 * devenait `NaN` et une date invalide un `Invalid Date`, tous deux écrits en
 * base sans erreur. Tout passe désormais par ces schémas.
 */

import { z } from 'zod'
import { parseDateInput } from './dates'
import { EXPENSE_CATEGORIES } from './expenses'
import { PAYMENT_TYPES } from './ledger'

/** Échec d'une server action, avec le détail par champ quand il existe. */
export interface ActionFailure {
    success: false
    error: string
    fieldErrors?: Record<string, string>
}

/** Résultat uniforme renvoyé par les server actions. */
export type ActionResult<T = undefined> =
    | { success: true; data?: T; message?: string }
    | ActionFailure

const requiredText = (label: string, max = 200) =>
    z
        .string()
        .trim()
        .min(1, `${label} est obligatoire.`)
        .max(max, `${label} ne doit pas dépasser ${max} caractères.`)

/** Normalise absent / vide en `null` avant validation. */
const blankToNull = (value: unknown) => {
    if (value === undefined || value === null) return null
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
}

/** Champ facultatif : chaîne vide → `null`. */
const optionalText = (max = 200) =>
    z.preprocess(
        blankToNull,
        z.string().max(max, `Ce champ ne doit pas dépasser ${max} caractères.`).nullable(),
    )

const optionalEmail = z.preprocess(
    blankToNull,
    z.string().email("L'adresse email n'est pas valide.").nullable(),
)

const optionalId = z.preprocess(blankToNull, z.string().nullable())

const postalCodeRegex = /^\d{5}$/

const postalCode = z
    .string()
    .trim()
    .regex(postalCodeRegex, 'Le code postal doit comporter 5 chiffres.')

/** Montant en euros : accepte « 1 234,56 » comme « 1234.56 ». */
const amount = (label: string, { min = 0 }: { min?: number } = {}) =>
    z
        .union([z.string(), z.number()])
        .transform((value) =>
            typeof value === 'number'
                ? value
                : Number(value.replace(/\s/g, '').replace(',', '.')),
        )
        .refine((value) => Number.isFinite(value), `${label} doit être un nombre.`)
        .refine((value) => value >= min, `${label} ne peut pas être inférieur à ${min}.`)
        .refine((value) => value <= 1_000_000, `${label} est hors limites.`)

const dateField = (label: string) =>
    z
        .union([z.string(), z.date()])
        .transform((value) => (value instanceof Date ? value : parseDateInput(value)))
        .refine((value): value is Date => value instanceof Date && !isNaN(value.getTime()), {
            message: `${label} n'est pas une date valide.`,
        })

export const PROPERTY_TYPES = [
    'Appartement',
    'Maison',
    'Studio',
    'Parking',
    'Local Commercial',
] as const

/** Case à cocher HTML : présente = « on », absente = non cochée. */
const checkbox = z.preprocess((value) => value === 'on' || value === 'true' || value === true, z.boolean())

/** Surface en m², facultative. */
const optionalSurface = z.preprocess(
    (value) => {
        const normalized = blankToNull(value)
        if (normalized === null) return null
        return Number(String(normalized).replace(',', '.'))
    },
    z
        .number()
        .refine((value) => Number.isFinite(value), 'La surface doit être un nombre.')
        .refine((value) => value > 0 && value <= 10000, 'La surface est hors limites.')
        .nullable(),
)

export const propertySchema = z.object({
    name: requiredText('Le nom du bien'),
    address: requiredText("L'adresse"),
    postalCode,
    city: requiredText('La ville', 100),
    type: z.enum(PROPERTY_TYPES),
    surface: optionalSurface,
    furnished: checkbox,
    singleRoom: checkbox,
})

export const updatePropertySchema = propertySchema.extend({
    id: requiredText('Identifiant'),
})

const tenantBase = {
    firstName: requiredText('Le prénom', 100),
    lastName: requiredText('Le nom', 100),
    email: optionalEmail,
    phone: optionalText(30),
    propertyId: optionalId,
    address: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string()),
    postalCode: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string()),
    city: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string()),
    rentAmount: amount('Le loyer'),
    chargeAmount: amount('Les charges'),
    startDate: dateField("La date d'entrée"),
}

interface AddressShape {
    propertyId: string | null
    address: string
    postalCode: string
    city: string
}

/**
 * Quand aucun bien n'est rattaché, l'adresse doit être saisie manuellement —
 * sinon elle est recopiée depuis le bien par la server action.
 */
const withAddressRule = <T extends z.ZodType<AddressShape>>(schema: T) =>
    schema.superRefine((value: AddressShape, ctx: z.RefinementCtx) => {
        if (value.propertyId) return
        if (!value.address) {
            ctx.addIssue({ code: 'custom', path: ['address'], message: "L'adresse est obligatoire." })
        }
        if (!/^\d{5}$/.test(value.postalCode)) {
            ctx.addIssue({
                code: 'custom',
                path: ['postalCode'],
                message: 'Le code postal doit comporter 5 chiffres.',
            })
        }
        if (!value.city) {
            ctx.addIssue({ code: 'custom', path: ['city'], message: 'La ville est obligatoire.' })
        }
    })

export const createTenantSchema = withAddressRule(z.object(tenantBase))

export const updateTenantSchema = withAddressRule(
    z.object({ ...tenantBase, id: requiredText('Identifiant') }),
)

export const paymentSchema = z.object({
    tenantId: requiredText('Identifiant du locataire'),
    amount: amount('Le montant', { min: 0.01 }),
    date: dateField('La date du paiement'),
    periodMonth: z.coerce.number().int().min(1, 'Mois invalide.').max(12, 'Mois invalide.'),
    periodYear: z.coerce
        .number()
        .int()
        .min(2000, 'Année invalide.')
        .max(2100, 'Année invalide.'),
    type: z.enum(PAYMENT_TYPES),
})

/** Charge déductible. La date est celle du décaissement (comptabilité de caisse). */
export const expenseSchema = z.object({
    category: z.enum(EXPENSE_CATEGORIES),
    label: requiredText('Le libellé', 150),
    amount: amount('Le montant', { min: 0.01 }),
    date: dateField('La date de règlement'),
    propertyId: optionalId,
    note: optionalText(500),
})

export const updateExpenseSchema = expenseSchema.extend({
    id: requiredText('Identifiant'),
})

export const landlordSchema = z.object({
    firstName: requiredText('Le prénom', 100),
    lastName: requiredText('Le nom', 100),
    email: z
        .string()
        .trim()
        .min(1, "L'email est obligatoire.")
        .email("L'adresse email n'est pas valide."),
    phone: optionalText(30),
    address: optionalText(),
    city: optionalText(100),
    postalCode: z.preprocess(
        blankToNull,
        z.string().regex(postalCodeRegex, 'Le code postal doit comporter 5 chiffres.').nullable(),
    ),
    siret: z.preprocess(
        (value) => {
            const normalized = blankToNull(value)
            return typeof normalized === 'string' ? normalized.replace(/\s/g, '') : normalized
        },
        z.string().regex(/^\d{14}$/, 'Le SIRET doit comporter 14 chiffres.').nullable(),
    ),
    companyName: optionalText(150),
})

export const terminateLeaseSchema = z.object({
    tenantId: requiredText('Identifiant du locataire'),
    endDate: dateField('La date de fin de bail'),
})

export const rentRevisionSchema = z.object({
    tenantId: requiredText('Identifiant du locataire'),
    newRentAmount: amount('Le nouveau loyer', { min: 0.01 }),
})

/** Convertit un FormData en objet simple exploitable par les schémas. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    formData.forEach((value, key) => {
        if (value instanceof File) return
        result[key] = value
    })
    return result
}

/**
 * Valide un FormData et retourne soit les données typées, soit un
 * `ActionResult` d'erreur prêt à être renvoyé au client.
 */
export function validateFormData<S extends z.ZodType>(
    schema: S,
    formData: FormData,
): { ok: true; data: z.infer<S> } | { ok: false; result: ActionFailure } {
    const parsed = schema.safeParse(formDataToObject(formData))
    if (parsed.success) return { ok: true, data: parsed.data }

    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_form'
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }

    return {
        ok: false,
        result: {
            success: false,
            error: Object.values(fieldErrors)[0] ?? 'Les informations saisies sont invalides.',
            fieldErrors,
        },
    }
}
