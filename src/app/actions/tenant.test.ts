import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { createTenant, deletePayment, getTenant, recordPayment, terminateLease } from './tenant'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const formDataOf = (values: Record<string, string>) => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) formData.append(key, value)
    return formData
}

const VALID_TENANT = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    phone: '0600000000',
    address: '3 rue des Lilas',
    postalCode: '75011',
    city: 'Paris',
    rentAmount: '650',
    chargeAmount: '50',
    startDate: '2026-01-15',
}

describe('Tenant server actions', () => {
    afterEach(() => jest.clearAllMocks())

    describe('authentification', () => {
        it('refuse un appel sans session', async () => {
            ;(auth as jest.Mock).mockResolvedValueOnce(null)

            const result = await createTenant(formDataOf(VALID_TENANT))

            expect(result.success).toBe(false)
            expect(prismaMock.tenant.create).not.toHaveBeenCalled()
        })
    })

    describe('getTenant', () => {
        it('retourne le locataire trouvé', async () => {
            const tenant = { id: '123', firstName: 'Jean', payments: [] }
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.findUnique.mockResolvedValue(tenant)

            const result = await getTenant('123')

            expect(result).toEqual({ success: true, data: tenant })
        })

        it('signale un locataire absent', async () => {
            prismaMock.tenant.findUnique.mockResolvedValue(null)

            const result = await getTenant('inconnu')

            expect(result.success).toBe(false)
        })

        it("n'expose pas l'erreur technique en cas de panne", async () => {
            prismaMock.tenant.findUnique.mockRejectedValue(new Error('SQLITE_BUSY'))

            const result = await getTenant('123')

            expect(result.success).toBe(false)
            expect(result.success === false && result.error).not.toContain('SQLITE_BUSY')
        })
    })

    describe('createTenant', () => {
        it('crée le locataire à partir de données valides', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.create.mockResolvedValue({ id: 't1' })

            const result = await createTenant(formDataOf(VALID_TENANT))

            expect(result.success).toBe(true)
            const { data } = prismaMock.tenant.create.mock.calls[0][0]
            expect(data.rentAmount).toBe(650)
            // Date normalisée à midi local : pas de glissement de fuseau.
            expect((data.startDate as Date).getDate()).toBe(15)
        })

        it('rejette un loyer non numérique sans écrire en base', async () => {
            const result = await createTenant(
                formDataOf({ ...VALID_TENANT, rentAmount: 'beaucoup' }),
            )

            expect(result.success).toBe(false)
            expect(result.success === false && result.fieldErrors?.rentAmount).toBeDefined()
            expect(prismaMock.tenant.create).not.toHaveBeenCalled()
        })

        it('rejette une date d’entrée invalide', async () => {
            const result = await createTenant(formDataOf({ ...VALID_TENANT, startDate: '' }))

            expect(result.success).toBe(false)
            expect(prismaMock.tenant.create).not.toHaveBeenCalled()
        })

        it("exige l'adresse quand aucun bien n'est rattaché", async () => {
            const result = await createTenant(formDataOf({ ...VALID_TENANT, address: '' }))

            expect(result.success).toBe(false)
            expect(result.success === false && result.fieldErrors?.address).toBeDefined()
        })

        it("reprend l'adresse du bien rattaché", async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.property.findUnique.mockResolvedValue({
                id: 'p1',
                address: '10 avenue du Parc',
                postalCode: '69003',
                city: 'Lyon',
            })
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.create.mockResolvedValue({ id: 't1' })

            const result = await createTenant(
                formDataOf({ ...VALID_TENANT, propertyId: 'p1', address: 'ignorée' }),
            )

            expect(result.success).toBe(true)
            const { data } = prismaMock.tenant.create.mock.calls[0][0]
            expect(data.address).toBe('10 avenue du Parc')
            expect(data.city).toBe('Lyon')
        })
    })

    describe('recordPayment', () => {
        it('rattache le paiement au mois demandé', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.findUnique.mockResolvedValue({ id: '123' })
            // @ts-expect-error jeu de données partiel
            prismaMock.payment.create.mockResolvedValue({ id: 'pay1' })

            const result = await recordPayment(
                formDataOf({
                    tenantId: '123',
                    amount: '700',
                    date: '2026-02-03',
                    type: 'Loyer',
                    periodMonth: '2',
                    periodYear: '2026',
                }),
            )

            expect(result.success).toBe(true)
            const { data } = prismaMock.payment.create.mock.calls[0][0]
            expect((data.periodStart as Date).getMonth()).toBe(1)
            expect((data.periodEnd as Date).getDate()).toBe(28)
        })

        it('rejette un montant nul', async () => {
            const result = await recordPayment(
                formDataOf({
                    tenantId: '123',
                    amount: '0',
                    date: '2026-02-03',
                    type: 'Loyer',
                    periodMonth: '2',
                    periodYear: '2026',
                }),
            )

            expect(result.success).toBe(false)
            expect(prismaMock.payment.create).not.toHaveBeenCalled()
        })

        it('rejette une nature de paiement inconnue', async () => {
            const result = await recordPayment(
                formDataOf({
                    tenantId: '123',
                    amount: '700',
                    date: '2026-02-03',
                    type: 'VIREMENT',
                    periodMonth: '2',
                    periodYear: '2026',
                }),
            )

            expect(result.success).toBe(false)
        })
    })

    describe('terminateLease', () => {
        it('enregistre la date de sortie', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.findUnique.mockResolvedValue({
                id: '123',
                startDate: new Date(2025, 0, 1, 12),
                propertyId: null,
            })

            const result = await terminateLease(
                formDataOf({ tenantId: '123', endDate: '2026-12-31' }),
            )

            expect(result.success).toBe(true)
            expect(prismaMock.tenant.update).toHaveBeenCalled()
        })

        it("refuse une sortie antérieure à l'entrée", async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.tenant.findUnique.mockResolvedValue({
                id: '123',
                startDate: new Date(2026, 5, 1, 12),
                propertyId: null,
            })

            const result = await terminateLease(
                formDataOf({ tenantId: '123', endDate: '2026-01-31' }),
            )

            expect(result.success).toBe(false)
            expect(prismaMock.tenant.update).not.toHaveBeenCalled()
        })
    })

    describe('deletePayment', () => {
        it('supprime un paiement existant', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.payment.findUnique.mockResolvedValue({ id: 'pay1' })

            const result = await deletePayment('pay1', 'tenant1')

            expect(result.success).toBe(true)
            expect(prismaMock.payment.delete).toHaveBeenCalledWith({ where: { id: 'pay1' } })
        })

        it('ne supprime rien si le paiement est introuvable', async () => {
            prismaMock.payment.findUnique.mockResolvedValue(null)

            const result = await deletePayment('inconnu', 'tenant1')

            expect(result.success).toBe(false)
            expect(prismaMock.payment.delete).not.toHaveBeenCalled()
        })
    })
})
