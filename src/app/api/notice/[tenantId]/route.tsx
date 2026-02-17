
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { NoticeDocument } from '@/components/pdf/NoticeTemplate';
import prisma from '@/lib/prisma';
import { calculateProrata, calculateTotalDueUntilDate } from '@/lib/calculations';

export async function GET(request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const params = await props.params;
    const tenantId = params.tenantId;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { property: true }
    });

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const now = new Date();
    let targetDate = now;

    if (monthParam && yearParam) {
        const m = parseInt(monthParam);
        const y = parseInt(yearParam);
        if (!isNaN(m) && !isNaN(y)) {
            targetDate = new Date(y, m - 1, 1);
        }
    }

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const startDate = new Date(tenant.startDate);
    const endDate = tenant.endDate ? new Date(tenant.endDate) : null;

    // Ajuster début si entrée en cours de mois
    const effectiveStart = (startDate > startOfMonth && startDate <= endOfMonth) ? startDate : startOfMonth;

    // Ajuster fin si sortie en cours de mois
    const effectiveEnd = (endDate && endDate < endOfMonth && endDate >= startOfMonth) ? endDate : endOfMonth;
    const rentDue = calculateProrata(tenant.rentAmount, tenant.chargeAmount, targetDate, startDate, endDate);

    // Calcul du solde précédent (jusqu'au mois d'avant la cible)
    const endOfPrevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);

    let prevDue = 0;
    try {
        prevDue = calculateTotalDueUntilDate(tenant.rentAmount, tenant.chargeAmount, startDate, endOfPrevMonth);
    } catch (e) {
        return NextResponse.json({ error: 'Erreur calcul solde', details: String(e) }, { status: 500 });
    }

    // 2. Payé précédent (Total payé à ce jour)
    const allPayments = await prisma.payment.findMany({ where: { tenantId: tenant.id } });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const previousBalance = totalPaid - prevDue;

    const rentPart = (rentDue > 0) ? (rentDue * (tenant.rentAmount / (tenant.rentAmount + tenant.chargeAmount))) : 0;
    const chargePart = (rentDue > 0) ? (rentDue * (tenant.chargeAmount / (tenant.rentAmount + tenant.chargeAmount))) : 0;

    // Récupérer les paiements CAF pour ce mois spécifique
    const cafPayments = allPayments.filter(p => {
        const pDate = new Date(p.periodStart);
        return pDate.getMonth() === targetDate.getMonth() &&
            pDate.getFullYear() === targetDate.getFullYear() &&
            p.typology === 'CAF';
    });
    const cafAmount = cafPayments.reduce((sum, p) => sum + p.amount, 0);

    const landlord = await prisma.landlord.findFirst();

    const stream = await renderToStream(
        NoticeDocument({
            tenant,
            landlord,
            period: { start: effectiveStart, end: effectiveEnd },
            amount: {
                rent: rentPart,
                charge: chargePart,
                total: rentDue,
                caf: cafAmount
            },
            date: now,
            previousBalance
        })
    );

    return new NextResponse(stream as unknown as ReadableStream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="avis-${tenant.lastName}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}.pdf"`,
        },
    });
}
