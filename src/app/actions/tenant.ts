'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { getTenantBalance } from '@/lib/ledger'
import {
    ActionFailure,
    ActionResult,
    createTenantSchema,
    paymentSchema,
    terminateLeaseSchema,
    updateTenantSchema,
    validateFormData,
} from '@/lib/validation'

/** Traduit une exception en `ActionResult` sans fuiter de détail technique. */
function toFailure(error: unknown, fallback: string): ActionFailure {
    if (error instanceof UnauthorizedError) {
        return { success: false, error: error.message }
    }
    console.error(fallback, error)
    return { success: false, error: fallback }
}

/**
 * Quand un bien est rattaché, son adresse fait foi ; sinon on garde l'adresse
 * saisie manuellement (utile pour les baux historiques sans bien).
 */
async function resolveAddress(input: {
    propertyId: string | null
    address: string
    postalCode: string
    city: string
}) {
    if (!input.propertyId) {
        return {
            propertyId: null,
            address: input.address,
            postalCode: input.postalCode,
            city: input.city,
        }
    }

    const property = await prisma.property.findUnique({ where: { id: input.propertyId } })
    if (!property) {
        throw new Error('Le bien sélectionné est introuvable.')
    }

    return {
        propertyId: property.id,
        address: property.address,
        postalCode: property.postalCode,
        city: property.city,
    }
}

export async function getTenants() {
    try {
        await requireSession()
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: { payments: true, property: true },
        })
        return { success: true as const, data: tenants }
    } catch (error) {
        return toFailure(error, 'Impossible de récupérer les locataires.')
    }
}

export interface TenantOverview {
    id: string
    firstName: string
    lastName: string
    city: string
    propertyName: string | null
    rentAmount: number
    chargeAmount: number
    monthlyTotal: number
    startDate: Date
    endDate: Date | null
    active: boolean
    balance: number
}

/** Liste des locataires enrichie du solde, pour les vues de synthèse. */
export async function getTenantsOverview() {
    try {
        await requireSession()

        const now = new Date()
        const tenants = await prisma.tenant.findMany({
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            include: {
                property: { select: { name: true } },
                payments: {
                    select: { amount: true, date: true, periodStart: true, typology: true },
                },
            },
        })

        const data: TenantOverview[] = tenants.map((tenant) => ({
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            city: tenant.city,
            propertyName: tenant.property?.name ?? null,
            rentAmount: tenant.rentAmount,
            chargeAmount: tenant.chargeAmount,
            monthlyTotal: tenant.rentAmount + tenant.chargeAmount,
            startDate: tenant.startDate,
            endDate: tenant.endDate,
            active: !tenant.endDate || tenant.endDate >= now,
            balance: getTenantBalance(tenant, tenant.payments, now).balance,
        }))

        return { success: true as const, data }
    } catch (error) {
        return toFailure(error, 'Impossible de récupérer les locataires.')
    }
}

export async function getTenant(id: string) {
    try {
        await requireSession()
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                payments: { orderBy: { date: 'desc' } },
                property: true,
                signatureRequests: { orderBy: { createdAt: 'desc' } },
            },
        })
        if (!tenant) return { success: false as const, error: 'Locataire introuvable.' }
        return { success: true as const, data: tenant }
    } catch (error) {
        return toFailure(error, 'Impossible de récupérer le locataire.')
    }
}

export async function createTenant(formData: FormData): Promise<ActionResult<{ id: string }>> {
    try {
        await requireSession()

        const parsed = validateFormData(createTenantSchema, formData)
        if (!parsed.ok) return parsed.result

        const { firstName, lastName, email, phone, rentAmount, chargeAmount, startDate } =
            parsed.data
        const location = await resolveAddress(parsed.data)

        const tenant = await prisma.tenant.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                rentAmount,
                chargeAmount,
                startDate,
                ...location,
            },
        })

        revalidatePath('/')
        revalidatePath('/tenants')
        if (location.propertyId) revalidatePath(`/properties/${location.propertyId}`)

        return { success: true, data: { id: tenant.id }, message: 'Locataire ajouté.' }
    } catch (error) {
        return toFailure(error, "Impossible d'ajouter le locataire.")
    }
}

export async function updateTenant(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(updateTenantSchema, formData)
        if (!parsed.ok) return parsed.result

        const { id, firstName, lastName, email, phone, rentAmount, chargeAmount, startDate } =
            parsed.data
        const location = await resolveAddress(parsed.data)

        await prisma.tenant.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                rentAmount,
                chargeAmount,
                startDate,
                ...location,
            },
        })

        revalidatePath('/')
        revalidatePath(`/tenants/${id}`)
        return { success: true, message: 'Locataire mis à jour.' }
    } catch (error) {
        return toFailure(error, 'Impossible de mettre à jour le locataire.')
    }
}

export async function recordPayment(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(paymentSchema, formData)
        if (!parsed.ok) return parsed.result

        const { tenantId, amount, date, periodMonth, periodYear, type } = parsed.data

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
        if (!tenant) return { success: false, error: 'Locataire introuvable.' }

        // Midi local : évite qu'un décalage de fuseau ne rattache le paiement
        // au mois précédent lors de la relecture.
        const periodStart = new Date(periodYear, periodMonth - 1, 1, 12)
        const periodEnd = new Date(periodYear, periodMonth, 0, 12)

        await prisma.payment.create({
            data: { tenantId, amount, date, periodStart, periodEnd, typology: type },
        })

        revalidatePath('/')
        revalidatePath(`/tenants/${tenantId}`)
        return { success: true, message: 'Paiement enregistré.' }
    } catch (error) {
        return toFailure(error, "Impossible d'enregistrer le paiement.")
    }
}

export async function deletePayment(paymentId: string, tenantId: string): Promise<ActionResult> {
    try {
        await requireSession()

        const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
        if (!payment) return { success: false, error: 'Paiement introuvable.' }

        await prisma.payment.delete({ where: { id: paymentId } })

        revalidatePath('/')
        revalidatePath(`/tenants/${tenantId}`)
        return { success: true, message: 'Paiement supprimé.' }
    } catch (error) {
        return toFailure(error, 'Impossible de supprimer le paiement.')
    }
}

export async function terminateLease(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(terminateLeaseSchema, formData)
        if (!parsed.ok) return parsed.result

        const { tenantId, endDate } = parsed.data

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
        if (!tenant) return { success: false, error: 'Locataire introuvable.' }
        if (endDate < tenant.startDate) {
            return {
                success: false,
                error: "La date de fin ne peut pas précéder la date d'entrée.",
                fieldErrors: { endDate: "La date de fin précède la date d'entrée." },
            }
        }

        await prisma.tenant.update({ where: { id: tenantId }, data: { endDate } })

        revalidatePath('/')
        revalidatePath(`/tenants/${tenantId}`)
        if (tenant.propertyId) revalidatePath(`/properties/${tenant.propertyId}`)
        return { success: true, message: 'Fin de bail enregistrée.' }
    } catch (error) {
        return toFailure(error, "Impossible d'enregistrer la fin de bail.")
    }
}
