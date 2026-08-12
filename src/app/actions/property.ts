'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import {
    ActionFailure,
    ActionResult,
    propertySchema,
    updatePropertySchema,
    validateFormData,
} from '@/lib/validation'

function toFailure(error: unknown, fallback: string): ActionFailure {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message }
    console.error(fallback, error)
    return { success: false, error: fallback }
}

export async function getProperties() {
    try {
        await requireSession()
        const properties = await prisma.property.findMany({
            orderBy: { name: 'asc' },
            include: {
                tenants: {
                    where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: { select: { tenants: true } },
            },
        })
        return { success: true as const, data: properties }
    } catch (error) {
        return toFailure(error, 'Impossible de récupérer les biens.')
    }
}

export async function createProperty(formData: FormData): Promise<ActionResult<{ id: string }>> {
    try {
        await requireSession()

        const parsed = validateFormData(propertySchema, formData)
        if (!parsed.ok) return parsed.result

        const property = await prisma.property.create({ data: parsed.data })

        revalidatePath('/properties')
        revalidatePath('/')
        return { success: true, data: { id: property.id }, message: 'Bien ajouté.' }
    } catch (error) {
        return toFailure(error, "Impossible d'ajouter le bien.")
    }
}

export async function updateProperty(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(updatePropertySchema, formData)
        if (!parsed.ok) return parsed.result

        const { id, ...data } = parsed.data

        const property = await prisma.property.findUnique({ where: { id } })
        if (!property) return { success: false, error: 'Bien introuvable.' }

        await prisma.property.update({ where: { id }, data })

        // Les baux rattachés reprennent l'adresse du bien sur leurs documents.
        await prisma.tenant.updateMany({
            where: { propertyId: id },
            data: {
                address: data.address,
                postalCode: data.postalCode,
                city: data.city,
            },
        })

        revalidatePath('/properties')
        revalidatePath(`/properties/${id}`)
        revalidatePath('/')
        return { success: true, message: 'Bien mis à jour.' }
    } catch (error) {
        return toFailure(error, 'Impossible de mettre à jour le bien.')
    }
}

export async function deleteProperty(propertyId: string): Promise<ActionResult> {
    try {
        await requireSession()

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                tenants: {
                    where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
                    select: { id: true },
                },
            },
        })

        if (!property) return { success: false, error: 'Bien introuvable.' }
        if (property.tenants.length > 0) {
            return {
                success: false,
                error: 'Impossible de supprimer un bien occupé par un locataire actif.',
            }
        }

        // Les anciens locataires conservent l'adresse du bien pour que leurs
        // quittances restent exactes une fois le bien supprimé.
        await prisma.$transaction([
            prisma.tenant.updateMany({
                where: { propertyId },
                data: {
                    propertyId: null,
                    address: property.address,
                    postalCode: property.postalCode,
                    city: property.city,
                },
            }),
            prisma.property.delete({ where: { id: propertyId } }),
        ])

        revalidatePath('/properties')
        revalidatePath('/')
        return { success: true, message: 'Bien supprimé.' }
    } catch (error) {
        return toFailure(error, 'Impossible de supprimer le bien.')
    }
}
