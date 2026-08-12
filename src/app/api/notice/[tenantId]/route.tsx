import { NextRequest, NextResponse } from 'next/server'
import { NoticeDocument } from '@/components/pdf/NoticeTemplate'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { calculateProrata } from '@/lib/calculations'
import { cafAmountForMonth, getCarriedBalance, splitRentAndCharge } from '@/lib/ledger'
import { endOfMonth, isSameMonth, resolveMonthParam, startOfMonth } from '@/lib/dates'
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

    // Solde reporté : seuls les règlements imputés aux mois *antérieurs* sont
    // déduits, sinon une avance payée d'avance serait comptée deux fois.
    const previousBalance = getCarriedBalance(tenant, tenant.payments, targetDate)

    const { rent, charge } = splitRentAndCharge(rentDue, tenant.rentAmount, tenant.chargeAmount)
    const cafAmount = cafAmountForMonth(tenant.payments, targetDate)

    const periodStart = isSameMonth(startDate, targetDate) ? startDate : startOfMonth(targetDate)
    const periodEnd =
        endDate && isSameMonth(endDate, targetDate) ? endDate : endOfMonth(targetDate)

    const landlord = await prisma.landlord.findFirst()

    return pdfResponse(
        NoticeDocument({
            tenant,
            landlord,
            period: { start: periodStart, end: periodEnd },
            amount: { rent, charge, total: rentDue, caf: cafAmount },
            date: new Date(),
            previousBalance,
        }),
        `avis-echeance-${tenant.lastName}-${targetDate.getMonth() + 1}-${targetDate.getFullYear()}`,
    )
}
