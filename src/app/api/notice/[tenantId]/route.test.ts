
/**
 * @jest-environment node
 */
import { GET } from './route';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

// Mock React PDF
jest.mock('@react-pdf/renderer', () => ({
    renderToStream: jest.fn().mockResolvedValue({
        pipe: jest.fn(),
    }),
}));

import prisma from '@/lib/prisma';
const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Notice API', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 and PDF stream', async () => {
        const req = new NextRequest('http://localhost:3000/api/notice/123?month=2&year=2023');
        const params = { params: Promise.resolve({ tenantId: '123' }) };

        // Mock Tenant
        // @ts-ignore
        prismaMock.tenant.findUnique.mockResolvedValue({
            id: '123',
            firstName: 'John',
            lastName: 'Doe',
            rentAmount: 500,
            chargeAmount: 50,
            property: { address: '123 Main St' }
        });

        // Mock Payments
        // @ts-ignore
        prismaMock.payment.findMany.mockResolvedValue([]);

        // Mock Landlord
        // @ts-ignore
        prismaMock.landlord.findFirst.mockResolvedValue({ firstName: 'Owner' });

        const response = await GET(req, params);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('should return 404 if tenant not found', async () => {
        const req = new NextRequest('http://localhost:3000/api/notice/999');
        const params = { params: Promise.resolve({ tenantId: '999' }) };

        // @ts-ignore
        prismaMock.tenant.findUnique.mockResolvedValue(null);

        const response = await GET(req, params);

        expect(response.status).toBe(404);
    });
});
