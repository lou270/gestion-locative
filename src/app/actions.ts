'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTenants() {
    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                payments: true,
                property: true // Inclure les infos du bien
            }
        })
        return { success: true, data: tenants }
    } catch (error) {
        return { success: false, error: 'Failed to fetch tenants' }
    }
}

export async function createTenant(formData: FormData) {
    try {
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const address = formData.get('address') as string
        const postalCode = formData.get('postalCode') as string
        const city = formData.get('city') as string
        const rentAmount = parseFloat(formData.get('rentAmount') as string)
        const chargeAmount = parseFloat(formData.get('chargeAmount') as string)
        const startDate = new Date(formData.get('startDate') as string)
        const propertyId = formData.get('propertyId') as string || null

        let finalAddress = address
        let finalPostalCode = postalCode
        let finalCity = city

        // Si un bien est lié, on récupère son adresse prioritairement
        if (propertyId) {
            const property = await prisma.property.findUnique({ where: { id: propertyId } })
            if (property) {
                finalAddress = property.address
                finalPostalCode = property.postalCode
                finalCity = property.city
            }
        }

        await prisma.tenant.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                address: finalAddress,
                postalCode: finalPostalCode,
                city: finalCity,
                rentAmount,
                chargeAmount,
                startDate,
                propertyId
            }
        })

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to create tenant' }
    }
}
