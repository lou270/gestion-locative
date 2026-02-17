
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

import { getTenant } from './tenant';

describe('Import Test', () => {
    it('should import function', () => {
        expect(typeof getTenant).toBe('function');
    });
});
