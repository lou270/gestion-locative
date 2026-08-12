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

// Le rendu PDF réel est hors périmètre : on vérifie le contrôle d'accès et les
// règles métier de la route, pas la mise en page du document.
jest.mock('@react-pdf/renderer', () => ({
    renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
    StyleSheet: { create: (styles: unknown) => styles },
    Document: 'Document',
    Page: 'Page',
    Text: 'Text',
    View: 'View',
}))

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { GET } from './route'

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>

const request = (url: string) => new NextRequest(url)
const params = (tenantId: string) => ({ params: Promise.resolve({ tenantId }) })

const TENANT = {
    id: '123',
    firstName: 'Jean',
    lastName: 'Dupont',
    address: '3 rue des Lilas',
    postalCode: '75011',
    city: 'Paris',
    rentAmount: 500,
    chargeAmount: 50,
    startDate: new Date(2026, 0, 1, 12),
    endDate: null,
    property: null,
    payments: [],
}

describe("Route de l'avis d'échéance", () => {
    beforeEach(() => {
        // @ts-expect-error jeu de données partiel
        prismaMock.landlord.findFirst.mockResolvedValue({ firstName: 'Marie', lastName: 'Martin' })
    })

    afterEach(() => jest.clearAllMocks())

    it('renvoie un PDF pour un mois du bail', async () => {
        // @ts-expect-error jeu de données partiel
        prismaMock.tenant.findUnique.mockResolvedValue(TENANT)

        const response = await GET(
            request('http://localhost:3000/api/notice/123?month=2&year=2026'),
            params('123'),
        )

        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('application/pdf')
    })

    it('refuse un accès non authentifié', async () => {
        ;(auth as jest.Mock).mockResolvedValueOnce(null)

        const response = await GET(
            request('http://localhost:3000/api/notice/123?month=2&year=2026'),
            params('123'),
        )

        expect(response.status).toBe(401)
        expect(prismaMock.tenant.findUnique).not.toHaveBeenCalled()
    })

    it('renvoie 404 si le locataire est introuvable', async () => {
        prismaMock.tenant.findUnique.mockResolvedValue(null)

        const response = await GET(
            request('http://localhost:3000/api/notice/999'),
            params('999'),
        )

        expect(response.status).toBe(404)
    })

    it("refuse un mois postérieur à la fin du bail", async () => {
        // @ts-expect-error jeu de données partiel
        prismaMock.tenant.findUnique.mockResolvedValue({
            ...TENANT,
            endDate: new Date(2026, 2, 31, 12),
        })

        const response = await GET(
            request('http://localhost:3000/api/notice/123?month=6&year=2026'),
            params('123'),
        )

        expect(response.status).toBe(400)
    })
})
