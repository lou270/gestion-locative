'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateTenant(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const rentAmount = parseFloat(formData.get('rentAmount') as string)
        const chargeAmount = parseFloat(formData.get('chargeAmount') as string)
        const startDate = new Date(formData.get('startDate') as string)

        // Handle property update
        const propertyId = formData.get('propertyId') as string || null
        let address = formData.get('address') as string
        let postalCode = formData.get('postalCode') as string
        let city = formData.get('city') as string

        if (propertyId) {
            const property = await prisma.property.findUnique({ where: { id: propertyId } })
            if (property) {
                address = property.address
                postalCode = property.postalCode
                city = property.city
            }
        }

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
                propertyId,
                address,
                postalCode,
                city
            }
        })

        revalidatePath(`/tenants/${id}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to update tenant' }
    }
}

export async function getTenant(id: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                payments: {
                    orderBy: { date: 'desc' }
                },
                property: true,
                signatureRequests: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        return { success: true, data: tenant }
    } catch (error) {
        return { success: false, error: 'Failed to fetch tenant' }
    }
}

export async function recordPayment(formData: FormData) {
    try {
        const tenantId = formData.get('tenantId') as string
        const amount = parseFloat(formData.get('amount') as string)
        const date = new Date(formData.get('date') as string)
        const type = formData.get('type') as string

        const periodMonth = parseInt(formData.get('periodMonth') as string)
        const periodYear = parseInt(formData.get('periodYear') as string)

        const periodStart = new Date(periodYear, periodMonth - 1, 1)
        const periodEnd = new Date(periodYear, periodMonth, 0)

        await prisma.payment.create({
            data: {
                tenantId,
                amount,
                date,
                periodStart,
                periodEnd,
                typology: type
            }
        })

        revalidatePath(`/tenants/${tenantId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to record payment' }
    }
}

export async function deletePayment(paymentId: string, tenantId: string) {
    try {
        await prisma.payment.delete({
            where: { id: paymentId }
        })
        revalidatePath(`/tenants/${tenantId}`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to delete payment' }
    }
}

export async function terminateLease(tenantId: string, endDate: Date) {
    if (!endDate) {
        throw new Error("Date de fin requise");
    }

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { endDate }
    });

    revalidatePath(`/tenants/${tenantId}`);
    return { success: true };
}

export async function deleteProperty(propertyId: string) {
    // Vérifier s'il y a des locataires actifs
    const activeTenants = await prisma.tenant.findFirst({
        where: {
            propertyId,
            endDate: null
        }
    });

    if (activeTenants) {
        throw new Error("Impossible de supprimer un bien avec des locataires actifs.");
    }

    // Récupérer les détails du bien pour copier l'adresse
    const property = await prisma.property.findUnique({
        where: { id: propertyId }
    });

    if (property) {
        // Désassocier les anciens locataires en copiant l'adresse du bien
        // UpdateMany ne permet pas de copier des champs d'une autre table, 
        // mais ici tous les locataires ont la même source.
        await prisma.tenant.updateMany({
            where: { propertyId },
            data: {
                propertyId: null,
                address: property.address,
                postalCode: property.postalCode,
                city: property.city
            }
        });
    }

    await prisma.property.delete({
        where: { id: propertyId }
    });

    revalidatePath('/properties');
    return { success: true };
}
