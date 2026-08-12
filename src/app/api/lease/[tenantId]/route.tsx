import { NextRequest, NextResponse } from 'next/server'
import { LeaseDocument } from '@/components/pdf/LeaseTemplate'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { pdfResponse } from '@/lib/pdf-response'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const denied = await guardApiRoute()
    if (denied) return denied

    const { tenantId } = await props.params

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { property: true },
    })

    if (!tenant) {
        return NextResponse.json({ error: 'Locataire introuvable.' }, { status: 404 })
    }

    const landlord = await prisma.landlord.findFirst()

    return pdfResponse(
        LeaseDocument({
            tenant,
            landlord,
            property: tenant.property,
            date: new Date(),
        }),
        `bail-location-${tenant.lastName}`,
    )
}
