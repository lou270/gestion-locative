import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { safeFilename } from '@/lib/pdf-response'
import { downloadSignedDocument } from '@/lib/yousign'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const denied = await guardApiRoute()
    if (denied) return denied

    const { id } = await props.params

    try {
        const signatureRequest = await prisma.signatureRequest.findUnique({
            where: { id },
            include: { tenant: true },
        })

        if (!signatureRequest?.externalId) {
            return NextResponse.json({ error: 'Demande de signature introuvable.' }, { status: 404 })
        }

        if (signatureRequest.status !== 'SIGNED') {
            return NextResponse.json(
                { error: "Le document n'est pas encore signé." },
                { status: 409 },
            )
        }

        const pdf = await downloadSignedDocument(signatureRequest.externalId)
        const filename = safeFilename(`bail-signe-${signatureRequest.tenant.lastName}`, 'bail-signe')

        return new NextResponse(new Uint8Array(pdf), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}.pdf"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (error) {
        console.error('Error downloading document:', error)
        return NextResponse.json({ error: 'Téléchargement impossible.' }, { status: 502 })
    }
}
