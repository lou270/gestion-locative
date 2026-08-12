import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { getSignatureRequestStatus } from '@/lib/yousign'

export const runtime = 'nodejs'

/** Statuts Yousign v3 → statuts internes. */
const STATUS_MAP: Record<string, string> = {
    done: 'SIGNED',
    refused: 'REJECTED',
    rejected: 'REJECTED',
    canceled: 'REJECTED',
    expired: 'EXPIRED',
    ongoing: 'PENDING',
    draft: 'PENDING',
}

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const denied = await guardApiRoute()
    if (denied) return denied

    const { id } = await props.params

    try {
        const signatureRequest = await prisma.signatureRequest.findUnique({ where: { id } })

        if (!signatureRequest?.externalId) {
            return NextResponse.json({ error: 'Demande de signature introuvable.' }, { status: 404 })
        }

        const yousignStatus = await getSignatureRequestStatus(signatureRequest.externalId)
        const newStatus = STATUS_MAP[yousignStatus.status] ?? signatureRequest.status

        if (newStatus !== signatureRequest.status) {
            await prisma.signatureRequest.update({ where: { id }, data: { status: newStatus } })
        }

        return NextResponse.json({ id: signatureRequest.id, status: newStatus })
    } catch (error) {
        console.error('Error checking signature status:', error)
        return NextResponse.json({ error: 'Statut indisponible pour le moment.' }, { status: 502 })
    }
}
