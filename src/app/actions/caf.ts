'use server'

import prisma from '@/lib/prisma'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { buildCafPrefill } from '@/lib/caf/prefill'
import { toFormValues } from '@/lib/caf/schema'
import type { ActionFailure } from '@/lib/validation'

/**
 * Valeurs proposées pour l'attestation de loyer d'un locataire, prêtes à être
 * affichées dans le formulaire de génération.
 */
export async function getCafPrefill(
    tenantId: string,
): Promise<{ success: true; data: Record<string, string> } | ActionFailure> {
    try {
        await requireSession()

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                property: true,
                payments: {
                    select: { amount: true, date: true, periodStart: true, typology: true },
                },
            },
        })

        if (!tenant) return { success: false, error: 'Locataire introuvable.' }

        const now = new Date()

        // Colocataires = autres baux en cours sur le même bien.
        const coTenants = tenant.propertyId
            ? await prisma.tenant.findMany({
                  where: {
                      propertyId: tenant.propertyId,
                      id: { not: tenant.id },
                      OR: [{ endDate: null }, { endDate: { gte: now } }],
                  },
                  select: { firstName: true, lastName: true },
              })
            : []

        const landlord = await prisma.landlord.findFirst()

        const prefill = buildCafPrefill({ tenant, landlord, coTenants, now })

        return { success: true, data: toFormValues(prefill) }
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Failed to build CAF prefill:', error)
        return { success: false, error: "Impossible de préparer l'attestation." }
    }
}
