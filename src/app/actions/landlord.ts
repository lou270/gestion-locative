'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { ActionResult, landlordSchema, validateFormData } from '@/lib/validation'

export async function getLandlord() {
    await requireSession()
    return await prisma.landlord.findFirst()
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
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Error updating landlord:', error)
        return { success: false, error: 'Une erreur est survenue lors de la sauvegarde.' }
    }
}
