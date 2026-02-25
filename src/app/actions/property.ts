'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function getProperties() {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const properties = await prisma.property.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                tenants: {
                    where: { endDate: null },
                    select: { id: true }
                },
                _count: {
                    select: { tenants: true }
                }
            }
        })
        return { success: true, data: properties }
    } catch (error) {
        return { success: false, error: 'Failed to fetch properties' }
    }
}

export async function createProperty(formData: FormData) {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    try {
        const name = formData.get('name') as string
        const address = formData.get('address') as string
        const postalCode = formData.get('postalCode') as string
        const city = formData.get('city') as string
        const type = formData.get('type') as string

        await prisma.property.create({
            data: {
                name,
                address,
                postalCode,
                city,
                type
            }
        })

        revalidatePath('/properties')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to create property' }
    }
}
