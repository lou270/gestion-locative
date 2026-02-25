
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function calculateNewRent(currentRent: number, oldIndex: number, newIndex: number) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    if (!oldIndex || !newIndex || oldIndex === 0) {
        return { success: false, error: 'Indices invalides' }
    }

    // Formule : Loyer x Nouvel Indice / Ancien Indice
    const newRent = (currentRent * newIndex) / oldIndex
    const percentage = ((newRent - currentRent) / currentRent) * 100

    return {
        success: true,
        data: {
            newRent: Number(newRent.toFixed(2)),
            percentage: Number(percentage.toFixed(2))
        }
    }
}

export async function applyRentRevision(tenantId: string, newRentAmount: number) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    if (!newRentAmount || newRentAmount <= 0) {
        return { success: false, error: 'Montant invalide' }
    }

    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { rentAmount: newRentAmount }
        })

        revalidatePath(`/tenants/${tenantId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update rent:", error)
        return { success: false, error: 'Erreur lors de la mise à jour du loyer' }
    }
}
