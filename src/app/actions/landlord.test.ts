import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getLandlord, updateLandlord } from './landlord'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const VALID = {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie@example.com',
    phone: '0600000000',
    address: '5 rue du Port',
    city: 'Nantes',
    postalCode: '44000',
    siret: '',
    companyName: 'SCI Les Oliviers',
}

const formDataOf = (values: Record<string, string>) => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) formData.append(key, value)
    return formData
}

describe('Landlord server actions', () => {
    afterEach(() => jest.clearAllMocks())

    describe('getLandlord', () => {
        it('retourne le profil bailleur', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.landlord.findFirst.mockResolvedValue({ id: 'l1', firstName: 'Marie' })

            await expect(getLandlord()).resolves.toEqual({ id: 'l1', firstName: 'Marie' })
        })

        it('lève sans session', async () => {
            ;(auth as jest.Mock).mockResolvedValueOnce(null)

            await expect(getLandlord()).rejects.toThrow()
        })
    })

    describe('updateLandlord', () => {
        it('crée le profil quand il n’existe pas encore', async () => {
            prismaMock.landlord.findFirst.mockResolvedValue(null)

            const result = await updateLandlord(formDataOf(VALID))

            expect(result.success).toBe(true)
            expect(prismaMock.landlord.create).toHaveBeenCalled()
        })

        it('met à jour le profil existant', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.landlord.findFirst.mockResolvedValue({ id: 'l1' })

            const result = await updateLandlord(formDataOf(VALID))

            expect(result.success).toBe(true)
            expect(prismaMock.landlord.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'l1' } }),
            )
        })

        it('rejette un email invalide sans écrire en base', async () => {
            const result = await updateLandlord(formDataOf({ ...VALID, email: 'marie@' }))

            expect(result.success).toBe(false)
            expect(result.success === false && result.fieldErrors?.email).toBeDefined()
            expect(prismaMock.landlord.create).not.toHaveBeenCalled()
            expect(prismaMock.landlord.update).not.toHaveBeenCalled()
        })

        it('rejette un SIRET incomplet', async () => {
            const result = await updateLandlord(formDataOf({ ...VALID, siret: '123' }))

            expect(result.success).toBe(false)
        })
    })
})
