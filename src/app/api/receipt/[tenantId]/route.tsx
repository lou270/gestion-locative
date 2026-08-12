import { NextRequest, NextResponse } from 'next/server'
import { ReceiptDocument } from '@/components/pdf/ReceiptTemplate'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { calculateProrata } from '@/lib/calculations'
import { cafAmountForMonth, canIssueReceipt, splitRentAndCharge } from '@/lib/ledger'
import { endOfMonth, isSameMonth, resolveMonthParam, startOfMonth } from '@/lib/dates'
import { formatCurrency } from '@/lib/format'
import { pdfResponse } from '@/lib/pdf-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const denied = await guardApiRoute()
    if (denied) return denied

    const { tenantId } = await props.params

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { property: true, payments: true },
    })

    if (!tenant) {
        return NextResponse.json({ error: 'Locataire introuvable.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const targetDate = resolveMonthParam(searchParams.get('month'), searchParams.get('year'))

    const startDate = new Date(tenant.startDate)
    const endDate = tenant.endDate ? new Date(tenant.endDate) : null

    // La date de sortie était ignorée ici : une quittance pouvait être émise
    // pour un mois postérieur à la fin du bail.
    const rentDue = calculateProrata(
        tenant.rentAmount,
        tenant.chargeAmount,
        targetDate,
        startDate,
        endDate,
    )

    if (rentDue <= 0) {
        return NextResponse.json(
            { error: "Aucun loyer n'est dû sur cette période (hors durée du bail)." },
            { status: 400 },
        )
    }

    const eligibility = canIssueReceipt(tenant, tenant.payments, targetDate)
    if (!eligibility.ok) {
        return NextResponse.json(
            {
                error:
                    `Loyer non acquitté : la quittance ne peut pas être délivrée. ` +
                    `Dû cumulé ${formatCurrency(eligibility.totalDue)} / ` +
                    `réglé ${formatCurrency(eligibility.totalPaid)}.`,
            },
            { status: 400 },
        )
    }

    const { rent, charge } = splitRentAndCharge(rentDue, tenant.rentAmount, tenant.chargeAmount)
    const cafAmount = cafAmountForMonth(tenant.payments, targetDate)

    // Bornes réelles d'occupation sur le mois (entrée ou sortie en cours de mois).
    const periodStart = isSameMonth(startDate, targetDate) ? startDate : startOfMonth(targetDate)
    const periodEnd =
        endDate && isSameMonth(endDate, targetDate) ? endDate : endOfMonth(targetDate)

    const lastPayment = tenant.payments
        .filter((p) => isSameMonth(new Date(p.periodStart), targetDate))
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]

    const landlord = await prisma.landlord.findFirst()

    return pdfResponse(
        ReceiptDocument({
            tenant,
            landlord,
            period: { start: periodStart, end: periodEnd },
            amount: { rent, charge, total: rentDue, caf: cafAmount },
            paymentDate: lastPayment?.date ?? new Date(),
            date: new Date(),
        }),
        `quittance-${tenant.lastName}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`,
    )
}
