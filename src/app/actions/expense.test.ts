import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { createExpense, deleteExpense, updateExpense } from './expense'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const formDataOf = (values: Record<string, string>) => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) formData.append(key, value)
    return formData
}

const VALID_EXPENSE = {
    category: 'TaxeFonciere',
    label: 'Taxe foncière 2025',
    amount: '900',
    date: '2025-10-15',
    propertyId: '',
    note: '',
}

describe('Expense server actions', () => {
    afterEach(() => jest.clearAllMocks())

    describe('authentification', () => {
        it('refuse un appel sans session', async () => {
            ;(auth as jest.Mock).mockResolvedValueOnce(null)

            const result = await createExpense(formDataOf(VALID_EXPENSE))

            expect(result.success).toBe(false)
            expect(prismaMock.expense.create).not.toHaveBeenCalled()
        })
    })

    describe('createExpense', () => {
        it('normalise le montant et la date avant écriture', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.expense.create.mockResolvedValue({ id: 'exp-1' })

            const result = await createExpense(
                formDataOf({ ...VALID_EXPENSE, amount: '1 234,56' }),
            )

            expect(result.success).toBe(true)

            const data = prismaMock.expense.create.mock.calls[0][0].data as {
                amount: number
                date: Date
                propertyId: string | null
                note: string | null
            }
            expect(data.amount).toBe(1234.56)
            // Les dates sont normalisées à midi local pour résister au fuseau.
            expect(data.date.getDate()).toBe(15)
            expect(data.date.getHours()).toBe(12)
            // Un champ vide devient null, jamais une chaîne vide.
            expect(data.propertyId).toBeNull()
            expect(data.note).toBeNull()
        })

        it('rejette une catégorie inconnue', async () => {
            const result = await createExpense(
                formDataOf({ ...VALID_EXPENSE, category: 'Vacances' }),
            )

            expect(result.success).toBe(false)
            expect(prismaMock.expense.create).not.toHaveBeenCalled()
        })

        it('rejette un montant nul', async () => {
            const result = await createExpense(formDataOf({ ...VALID_EXPENSE, amount: '0' }))

            expect(result.success).toBe(false)
            expect(prismaMock.expense.create).not.toHaveBeenCalled()
        })

        it('rejette un libellé vide', async () => {
            const result = await createExpense(formDataOf({ ...VALID_EXPENSE, label: '   ' }))

            expect(result.success).toBe(false)
        })

        it('refuse un bien inexistant plutôt que de laisser fuir une erreur Prisma', async () => {
            prismaMock.property.findUnique.mockResolvedValue(null)

            const result = await createExpense(
                formDataOf({ ...VALID_EXPENSE, propertyId: 'inconnu' }),
            )

            expect(result).toMatchObject({ success: false, error: 'Bien introuvable.' })
            expect(prismaMock.expense.create).not.toHaveBeenCalled()
        })

        it("n'expose pas l'erreur technique en cas de panne", async () => {
            prismaMock.expense.create.mockRejectedValue(new Error('SQLITE_BUSY'))
            jest.spyOn(console, 'error').mockImplementation(() => {})

            const result = await createExpense(formDataOf(VALID_EXPENSE))

            expect(result).toMatchObject({
                success: false,
                error: "Impossible d'enregistrer la charge.",
            })
        })
    })

    describe('updateExpense', () => {
        it('signale une charge absente', async () => {
            prismaMock.expense.findUnique.mockResolvedValue(null)

            const result = await updateExpense(formDataOf({ ...VALID_EXPENSE, id: 'inconnu' }))

            expect(result).toMatchObject({ success: false, error: 'Charge introuvable.' })
            expect(prismaMock.expense.update).not.toHaveBeenCalled()
        })
    })

    describe('deleteExpense', () => {
        it('supprime une charge existante', async () => {
            // @ts-expect-error jeu de données partiel
            prismaMock.expense.findUnique.mockResolvedValue({ id: 'exp-1' })

            const result = await deleteExpense('exp-1')

            expect(result.success).toBe(true)
            expect(prismaMock.expense.delete).toHaveBeenCalledWith({ where: { id: 'exp-1' } })
        })

        it('signale une charge absente', async () => {
            prismaMock.expense.findUnique.mockResolvedValue(null)

            const result = await deleteExpense('inconnu')

            expect(result.success).toBe(false)
            expect(prismaMock.expense.delete).not.toHaveBeenCalled()
        })
    })
})
