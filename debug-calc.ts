
import { calculateTotalDueUntilDate } from './src/lib/calculations';

const rent = 500;
const charge = 50;
const startDate = new Date('2025-01-15');
const targetDateNotice = new Date('2026-02-01'); // Notice requested for Feb 2026

// End of previous month (Jan 2026)
const endOfPrevMonth = new Date(targetDateNotice.getFullYear(), targetDateNotice.getMonth(), 0);

console.log('StartDate:', startDate);
console.log('Target for Notice:', targetDateNotice);
console.log('End of Prev Month:', endOfPrevMonth);

try {
    const totalDue = calculateTotalDueUntilDate(rent, charge, startDate, endOfPrevMonth);
    console.log('Total Due Calculated:', totalDue);
} catch (e) {
    console.error('Error in calculation:', e);
}
