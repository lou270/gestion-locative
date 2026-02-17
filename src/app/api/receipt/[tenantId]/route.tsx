import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptDocument } from '@/components/pdf/ReceiptTemplate';
import prisma from '@/lib/prisma';
import { calculateProrata, calculateTotalDueUntilDate } from '@/lib/calculations';

export async function GET(request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const params = await props.params;
    const tenantId = params.tenantId;

    // Récupérer le locataire depuis la DB avec ses infos de bien
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
    // Utiliser les params ou la date actuelle par défaut
    const targetDate = (monthParam && yearParam)
        ? new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1)
        : now;

    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const startDate = new Date(tenant.startDate);

    // Ajustement de la date de début si c'est le mois d'entrée
    const isEntryMonth = targetDate.getMonth() === startDate.getMonth() && targetDate.getFullYear() === startDate.getFullYear();
    const effectiveStart = isEntryMonth ? startDate : startOfMonth;

    const rentDue = calculateProrata(tenant.rentAmount, tenant.chargeAmount, targetDate, startDate);

    // --- NOUVELLE LOGIQUE DE VALIDATION (Solde Global) ---
    // 1. Calcul du dû cumulé jusqu'à la fin du mois demandé (pour valider le droit à la quittance)
    const totalDueUntilEndOfMonth = calculateTotalDueUntilDate(tenant.rentAmount, tenant.chargeAmount, startDate, targetDate);

    // 2. Calcul du payé cumulé TOTAL (tous les paiements enregistrés à ce jour)
    const allPayments = await prisma.payment.findMany({
        where: { tenantId: tenant.id }
    });
    const totalPaidGlobal = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Validation : Le solde global doit couvrir le dû jusqu'à ce mois
    if (totalPaidGlobal < totalDueUntilEndOfMonth - 0.01) {
        return NextResponse.json(
            { error: `Loyer non acquitté. Compte débiteur. Total Dû (à fin ${targetDate.getMonth() + 1}/${targetDate.getFullYear()}): ${totalDueUntilEndOfMonth.toFixed(2)}€ / Total Payé: ${totalPaidGlobal.toFixed(2)}€` },
            { status: 400 }
        );
    }

    // Si rien n'est dû, on met 0 (ou on pourrait bloquer la génération)
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
        ReceiptDocument({
            tenant,
            landlord,
            period: { start: effectiveStart, end: endOfMonth },
            amount: {
                rent: rentPart,
                charge: chargePart,
                total: rentDue,
                caf: cafAmount
            },
            paymentDate: now, // Date du dernier paiement (approx) ou NOW
            date: now
        })
    );

    return new NextResponse(stream as unknown as ReadableStream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quittance-${tenant.lastName}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}.pdf"`,
        },
    });
}
