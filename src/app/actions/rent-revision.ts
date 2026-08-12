'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { ActionResult } from '@/lib/validation'
import { round } from '@/lib/ledger'

/**
 * Révision annuelle du loyer indexée sur l'IRL :
 * nouveau loyer = loyer actuel x nouvel indice / ancien indice.
 */
export async function calculateNewRent(
    currentRent: number,
    oldIndex: number,
    newIndex: number,
): Promise<ActionResult<{ newRent: number; percentage: number }>> {
    try {
        await requireSession()

        if (!Number.isFinite(currentRent) || currentRent <= 0) {
            return { success: false, error: 'Le loyer actuel est invalide.' }
        }
        if (!Number.isFinite(oldIndex) || oldIndex <= 0) {
            return { success: false, error: "L'ancien indice IRL doit être supérieur à 0." }
        }
        if (!Number.isFinite(newIndex) || newIndex <= 0) {
            return { success: false, error: 'Le nouvel indice IRL doit être supérieur à 0.' }
        }

        const newRent = round((currentRent * newIndex) / oldIndex)
        const percentage = round(((newRent - currentRent) / currentRent) * 100)

        return { success: true, data: { newRent, percentage } }
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Failed to compute rent revision:', error)
        return { success: false, error: 'Erreur lors du calcul de la révision.' }
    }
}

export async function applyRentRevision(
    tenantId: string,
    newRentAmount: number,
): Promise<ActionResult> {
    try {
        await requireSession()

        if (!Number.isFinite(newRentAmount) || newRentAmount <= 0) {
            return { success: false, error: 'Le montant du nouveau loyer est invalide.' }
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
        if (!tenant) return { success: false, error: 'Locataire introuvable.' }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { rentAmount: round(newRentAmount) },
        })

        revalidatePath('/')
        revalidatePath(`/tenants/${tenantId}`)
        return { success: true, message: 'Nouveau loyer appliqué.' }
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Failed to update rent:', error)
        return { success: false, error: 'Erreur lors de la mise à jour du loyer.' }
    }
}
