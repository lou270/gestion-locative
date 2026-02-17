
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

import { getLandlord, updateLandlord } from './landlord';
import prisma from '@/lib/prisma';

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('Landlord Server Actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getLandlord', () => {
        it('should return landlord data', async () => {
            // @ts-ignore
            prismaMock.landlord.findFirst.mockResolvedValue({ id: 'l1', firstName: 'Jean' });

            const result = await getLandlord();
            expect(result).toEqual({ id: 'l1', firstName: 'Jean' });
        });
    });

    describe('updateLandlord', () => {
        it('should create landlord if not exists', async () => {
            const formData = new FormData();
            formData.append('firstName', 'Paul');
            // ... other fields

            // @ts-ignore
            prismaMock.landlord.findFirst.mockResolvedValue(null);
            // @ts-ignore
            prismaMock.landlord.create.mockResolvedValue({ id: 'l1' });

            const result = await updateLandlord(formData);

            expect(result.success).toBe(true);
            expect(prismaMock.landlord.create).toHaveBeenCalled();
        });

        it('should update landlord if exists', async () => {
            const formData = new FormData();
            formData.append('firstName', 'Paul');

            // @ts-ignore
            prismaMock.landlord.findFirst.mockResolvedValue({ id: 'l1' });

            const result = await updateLandlord(formData);

            expect(result.success).toBe(true);
            expect(prismaMock.landlord.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'l1' }
            }));
        });
    });
});
