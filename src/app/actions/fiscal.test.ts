import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getFiscalSummary } from './fiscal'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const emptyDatabase = () => {
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.expense.findMany.mockResolvedValue([])
    prismaMock.payment.findFirst.mockResolvedValue(null)
    prismaMock.expense.findFirst.mockResolvedValue(null)
    prismaMock.property.findMany.mockResolvedValue([])
}

describe('getFiscalSummary', () => {
    afterEach(() => jest.clearAllMocks())

    describe('authentification', () => {
        it('refuse un appel sans session', async () => {
            ;(auth as jest.Mock).mockResolvedValueOnce(null)

            const result = await getFiscalSummary(2025)

            expect(result.success).toBe(false)
            expect(prismaMock.payment.findMany).not.toHaveBeenCalled()
        })
    })

    it("borne les paiements et les charges sur la même année civile", async () => {
        emptyDatabase()

        await getFiscalSummary(2025)

        const expected = { date: { gte: new Date(2025, 0, 1), lt: new Date(2026, 0, 1) } }
        expect(prismaMock.payment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expected }),
        )
        expect(prismaMock.expense.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expected }),
        )
    })

    it("propose toujours l'année demandée et l'année courante", async () => {
        emptyDatabase()

        const result = await getFiscalSummary(2025)

        expect(result.success).toBe(true)
        if (!result.success) return

        expect(result.data.availableYears).toContain(2025)
        expect(result.data.availableYears).toContain(new Date().getFullYear())
    })

    it("n'expose pas l'erreur technique en cas de panne", async () => {
        prismaMock.payment.findMany.mockRejectedValue(new Error('SQLITE_BUSY'))
        jest.spyOn(console, 'error').mockImplementation(() => {})

        const result = await getFiscalSummary(2025)

        expect(result).toEqual({
            success: false,
            error: 'Impossible de calculer la synthèse fiscale.',
        })
    })
})
