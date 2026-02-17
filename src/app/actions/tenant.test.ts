
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock dependencies BEFORE importing the module
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

// Import module AFTER mocking
import { getTenant, terminateLease, deleteProperty, recordPayment, deletePayment } from './tenant';
import prisma from '@/lib/prisma'; // This will be the mocked version

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Tenant Server Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getTenant', () => {
        it('should return tenant data if found', async () => {
            const mockTenant = {
                id: '123',
                firstName: 'John',
                lastName: 'Doe',
                payments: [],
                property: { name: 'Appartement' }
            };

            // @ts-ignore
            prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

            const result = await getTenant('123');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTenant);
            expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
                where: { id: '123' },
                include: {
                    payments: { orderBy: { date: 'desc' } },
                    property: true
                }
            });
        });

        it('should return success:false if error occurs', async () => {
            prismaMock.tenant.findUnique.mockRejectedValue(new Error('DB Error'));

            const result = await getTenant('123');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('terminateLease', () => {
        it('should update tenant end date', async () => {
            const endDate = new Date('2023-12-31');

            // @ts-ignore
            prismaMock.tenant.update.mockResolvedValue({ id: '123', endDate });

            const result = await terminateLease('123', endDate);

            expect(result.success).toBe(true);
            expect(prismaMock.tenant.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: { endDate }
            });
        });

        it('should throw error if no date provided', async () => {
            // @ts-ignore
            await expect(terminateLease('123', null)).rejects.toThrow("Date de fin requise");
        });
    });

    describe('deleteProperty', () => {
        it('should delete property if no active tenants', async () => {
            prismaMock.tenant.findFirst.mockResolvedValue(null);

            // @ts-ignore
            prismaMock.property.delete.mockResolvedValue({ id: 'prop1' });

            const result = await deleteProperty('prop1');

            expect(result.success).toBe(true);
            expect(prismaMock.property.delete).toHaveBeenCalledWith({
                where: { id: 'prop1' }
            });
        });

        it('should throw error if active tenants exist', async () => {
            // @ts-ignore
            prismaMock.tenant.findFirst.mockResolvedValue({ id: 't1' });

            await expect(deleteProperty('prop1')).rejects.toThrow("Impossible de supprimer un bien avec des locataires actifs");

            expect(prismaMock.property.delete).not.toHaveBeenCalled();
        });
    });

    describe('recordPayment', () => {
        it('should create payment', async () => {
            const formData = new FormData();
            formData.append('tenantId', '123');
            formData.append('amount', '500');
            formData.append('date', '2023-01-01');
            formData.append('type', 'VIREMENT');
            formData.append('periodMonth', '1');
            formData.append('periodYear', '2023');

            // @ts-ignore
            prismaMock.payment.create.mockResolvedValue({ id: 'pay1' });

            const result = await recordPayment(formData);

            expect(result.success).toBe(true);
            expect(prismaMock.payment.create).toHaveBeenCalled();
        });
    });

    describe('deletePayment', () => {
        it('should delete payment', async () => {
            // @ts-ignore
            prismaMock.payment.delete.mockResolvedValue({ id: 'pay1' });

            const result = await deletePayment('pay1', 'tenant1');

            expect(result.success).toBe(true);
            expect(prismaMock.payment.delete).toHaveBeenCalledWith({
                where: { id: 'pay1' }
            });
        });
    });
});
