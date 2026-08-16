'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { ActionFailure, ActionResult, landlordSchema, validateFormData } from '@/lib/validation'

function toFailure(error: unknown, fallback: string): ActionFailure {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message }
    console.error(fallback, error)
    return { success: false, error: fallback }
}

/**
 * Profil bailleur, ou `null` s'il n'a jamais été renseigné — ce qui n'est pas
 * une erreur : l'application démarre sur une base vide et les documents portent
 * alors une mention générique.
 */
export async function getLandlord() {
    try {
        await requireSession()
        const landlord = await prisma.landlord.findFirst()
        return { success: true as const, data: landlord }
    } catch (error) {
        return toFailure(error, 'Impossible de récupérer le profil bailleur.')
    }
}

export async function updateLandlord(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(landlordSchema, formData)
        if (!parsed.ok) return parsed.result

        const existing = await prisma.landlord.findFirst()

        if (existing) {
            await prisma.landlord.update({ where: { id: existing.id }, data: parsed.data })
        } else {
            await prisma.landlord.create({ data: parsed.data })
        }

        // Les coordonnées du bailleur apparaissent sur tous les documents générés.
        revalidatePath('/settings')
        revalidatePath('/')
        return { success: true, message: 'Paramètres mis à jour avec succès.' }
    } catch (error) {
        return toFailure(error, 'Une erreur est survenue lors de la sauvegarde.')
    }
}
