
import { PrismaClient } from '@prisma/client';
import { calculateProrata, calculateTotalDueUntilDate } from './src/lib/calculations';

const prisma = new PrismaClient();

async function debugNotice() {
    const tenantId = 'cmlfqyvso0006a9awqi9j7abr';
    const targetDate = new Date(2026, 1, 1); // Feb 1st 2026

    console.log(`[Debug] Fetching tenant ${tenantId}...`);
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { property: true }
    });

    if (!tenant) {
        console.error('[Debug] Tenant not found');
        return;
    }

    console.log(`[Debug] Tenant found: ${tenant.firstName} ${tenant.lastName}`);
    console.log(`[Debug] Start Date: ${tenant.startDate.toISOString()}`);

    const startDate = new Date(tenant.startDate);
    const endOfPrevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);

    console.log(`[Debug] Target: ${targetDate.toISOString()}`);
    console.log(`[Debug] End Prev Month: ${endOfPrevMonth.toISOString()}`);

    console.log('[Debug] Calculating Rent Due...');
    const rentDue = calculateProrata(tenant.rentAmount, tenant.chargeAmount, targetDate, startDate);
    console.log(`[Debug] Rent Due: ${rentDue}`);

    console.log('[Debug] Calculating Prev Due...');
    try {
        const prevDue = calculateTotalDueUntilDate(tenant.rentAmount, tenant.chargeAmount, startDate, endOfPrevMonth);
        console.log(`[Debug] Prev Due: ${prevDue}`);

        const allPayments = await prisma.payment.findMany({ where: { tenantId: tenant.id } });
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        console.log(`[Debug] Total Paid: ${totalPaid}`);

        const previousBalance = totalPaid - prevDue;
        console.log(`[Debug] Previous Balance: ${previousBalance}`);

    } catch (e) {
        console.error('[Debug] CRITICAL ERROR in calculation:', e);
    }
}

debugNotice()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
