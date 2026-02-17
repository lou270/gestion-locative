import { calculateProrata, calculateTotalDueUntilDate } from './calculations';

describe('Calculations Logic', () => {
    const rent = 1000;
    const charge = 100;
    const total = 1100;

    describe('calculateProrata', () => {
        it('should return full amount for a full month', () => {
            const startDate = new Date(2023, 0, 15); // Started in Jan
            const targetDate = new Date(2023, 2, 10); // Checking March (Full)

            const result = calculateProrata(rent, charge, targetDate, startDate);
            expect(result).toBe(total);
        });

        it('should return 0 if target month is before start date month', () => {
            const startDate = new Date(2023, 2, 15); // Start March
            const targetDate = new Date(2023, 1, 10); // Check Feb

            const result = calculateProrata(rent, charge, targetDate, startDate);
            expect(result).toBe(0);
        });

        it('should calculate prorata for entry month (Feb 28 days)', () => {
            // Feb 2023 has 28 days.
            // Entry 15 Feb. Days active: 15, 16, ... 28. (28 - 15 + 1) = 14 days?
            // Let's check the logic in calculations.ts implies inclusive or exclusive?
            // Assuming standard inclusive: 15 to 28 = 14 days.
            // Formula: (Total / NbDaysInMonth) * NbDaysOccupied
            const startDate = new Date(2023, 1, 15); // 15 Feb
            const targetDate = new Date(2023, 1, 1); // Checking Feb

            const result = calculateProrata(rent, charge, targetDate, startDate);
            const dailyRate = 1100 / 28;
            const days = (28 - 15) + 1; // 14
            const expected = dailyRate * days;

            expect(result).toBeCloseTo(expected, 2);
        });

        it('should calculate prorata for entry month (Leap year Feb 29 days)', () => {
            const startDate = new Date(2024, 1, 15); // 15 Feb 2024
            const targetDate = new Date(2024, 1, 1);

            const result = calculateProrata(rent, charge, targetDate, startDate);
            const dailyRate = 1100 / 29;
            const days = (29 - 15) + 1; // 15
            const expected = dailyRate * days;

            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('calculateTotalDueUntilDate', () => {
        it('should calculate total for multiple full months', () => {
            const startDate = new Date(2023, 0, 1); // 1 Jan
            const targetDate = new Date(2023, 2, 15); // Mid March
            // Should cover Jan, Feb, March (full rent due for started month usually?)
            // The function implies "Total due until date".
            // If checking "until mid march", does it verify if march is paid?
            // Usually "Due" means "Rent generated for Jan, Feb, March".

            const result = calculateTotalDueUntilDate(rent, charge, startDate, targetDate);
            // Jan (1100) + Feb (1100) + March (1100) = 3300
            expect(result).toBe(3300);
        });

        it('should handle prorata entry + full months', () => {
            const startDate = new Date(2023, 0, 15); // 15 Jan (31 days)
            const targetDate = new Date(2023, 2, 1); // March

            // Jan: 17 days (15..31) -> (1100/31)*17
            // Feb: Full (1100)
            // March: Full (1100)

            const result = calculateTotalDueUntilDate(rent, charge, startDate, targetDate);

            const janDue = (1100 / 31) * ((31 - 15) + 1);
            const expected = janDue + 1100 + 1100;

            expect(result).toBeCloseTo(expected, 2);
        });

        it('should calculate total due stopping at endDate', () => {
            const rent = 550; // Total
            const charge = 0;
            const startDate = new Date(2023, 0, 1); // 1st Jan
            const endDate = new Date(2023, 2, 31); // 31st March (3 full months)
            const targetDate = new Date(2023, 5, 1); // June (should ignore April, May, June)

            const result = calculateTotalDueUntilDate(rent, charge, startDate, targetDate, endDate);
            // 3 months * 550 = 1650
            expect(result).toBe(1650);
        });

        it('should calculate prorata for exit month', () => {
            const rent = 1000;
            const charge = 0;
            const startDate = new Date(2023, 0, 1);
            const endDate = new Date(2023, 0, 15); // 15 days in Jan

            // Check prorata function directly
            const prorata = calculateProrata(rent, charge, new Date(2023, 0, 1), startDate, endDate);
            const expected = (1000 / 31) * 15;
            expect(prorata).toBeCloseTo(expected, 2);

            // Check total calculation
            const total = calculateTotalDueUntilDate(rent, charge, startDate, new Date(2023, 1, 1), endDate);
            expect(total).toBeCloseTo(expected, 2);
        });
    });
});
