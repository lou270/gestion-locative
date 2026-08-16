/**
 * @jest-environment node
 */
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { GET } from './route'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const request = (url: string) => new NextRequest(url)

const PAYMENT = {
    amount: 650,
    date: new Date(2025, 0, 5, 12),
    typology: 'Loyer',
    periodStart: new Date(2025, 0, 1, 12),
    periodEnd: new Date(2025, 0, 31, 12),
    tenant: {
        id: 'tenant-1',
        firstName: 'Marie',
        lastName: 'Dupont',
        property: { id: 'prop-1', name: 'Appartement Centre' },
    },
}

const EXPENSE = {
    id: 'exp-1',
    amount: 900,
    date: new Date(2025, 9, 15, 12),
    category: 'TaxeFonciere',
    label: 'Taxe foncière 2025',
    note: null,
    property: { id: 'prop-1', name: 'Appartement Centre' },
}

describe("Route d'export fiscal CSV", () => {
    beforeEach(() => {
        // @ts-expect-error jeu de données partiel
        prismaMock.payment.findMany.mockResolvedValue([PAYMENT])
        // @ts-expect-error jeu de données partiel
        prismaMock.expense.findMany.mockResolvedValue([EXPENSE])
    })

    afterEach(() => jest.clearAllMocks())

    it('refuse un appel sans session', async () => {
        ;(auth as jest.Mock).mockResolvedValueOnce(null)

        const response = await GET(request('http://localhost/api/fiscal/export?year=2025'))

        expect(response.status).toBe(401)
        expect(prismaMock.payment.findMany).not.toHaveBeenCalled()
    })

    it('renvoie un CSV téléchargeable, précédé du BOM UTF-8', async () => {
        const response = await GET(request('http://localhost/api/fiscal/export?year=2025'))

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
        expect(response.headers.get('Content-Disposition')).toContain(
            'export-fiscal-lmnp-2025.csv',
        )

        const bytes = new Uint8Array(await response.arrayBuffer())
        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    })

    it('produit une ligne par mouvement, charges signées négativement', async () => {
        const response = await GET(request('http://localhost/api/fiscal/export?year=2025'))
        const lines = (await response.text()).trim().split('\r\n')

        expect(lines[0]).toContain('Type;Date;Categorie')
        expect(lines).toHaveLength(3)
        expect(lines[1]).toContain('650,00')
        expect(lines[2]).toContain('-900,00')
    })

    it("retombe sur l'année courante quand le paramètre est absent", async () => {
        const response = await GET(request('http://localhost/api/fiscal/export'))

        expect(response.headers.get('Content-Disposition')).toContain(
            `export-fiscal-lmnp-${new Date().getFullYear()}.csv`,
        )
    })
})
