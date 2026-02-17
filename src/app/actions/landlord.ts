'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLandlord() {
    return await prisma.landlord.findFirst();
}

export async function updateLandlord(data: FormData) {
    const firstName = data.get('firstName') as string;
    const lastName = data.get('lastName') as string;
    const email = data.get('email') as string;
    const phone = data.get('phone') as string;
    const address = data.get('address') as string;
    const city = data.get('city') as string;
    const postalCode = data.get('postalCode') as string;
    const siret = data.get('siret') as string;
    const companyName = data.get('companyName') as string;

    try {
        const existing = await prisma.landlord.findFirst();

        if (existing) {
            await prisma.landlord.update({
                where: { id: existing.id },
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    city,
                    postalCode,
                    siret,
                    companyName
                }
            });
        } else {
            await prisma.landlord.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    city,
                    postalCode,
                    siret,
                    companyName
                }
            });
        }

        revalidatePath('/settings');
        return { success: true, message: 'Paramètres mis à jour avec succès' };
    } catch (error) {
        console.error('Error updating landlord:', error);
        return { success: false, message: 'Une erreur est survenue lors de la sauvegarde' };
    }
}
