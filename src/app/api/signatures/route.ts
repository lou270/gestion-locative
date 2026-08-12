import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { initiateSignatureRequest } from '@/lib/yousign'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo

export async function POST(request: NextRequest) {
    // Route non protégée par le middleware : sans ce garde, un tiers pouvait
    // déclencher des demandes de signature facturées sur le compte Yousign.
    const denied = await guardApiRoute()
    if (denied) return denied

    try {
        const formData = await request.formData()
        const tenantId = formData.get('tenantId')
        const file = formData.get('file')

        if (typeof tenantId !== 'string' || !tenantId || !(file instanceof File)) {
            return NextResponse.json({ error: 'Locataire ou fichier manquant.' }, { status: 400 })
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Le document doit être un PDF.' }, { status: 400 })
        }

        if (file.size === 0 || file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'Le PDF doit faire entre 1 octet et 10 Mo.' },
                { status: 400 },
            )
        }

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
        if (!tenant) {
            return NextResponse.json({ error: 'Locataire introuvable.' }, { status: 404 })
        }

        if (!tenant.email) {
            return NextResponse.json(
                { error: "Le locataire n'a pas d'adresse email : impossible d'envoyer à signer." },
                { status: 400 },
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        const signatureResponse = await initiateSignatureRequest(buffer, file.name, {
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            phone: tenant.phone || undefined,
        })

        const signatureRequest = await prisma.signatureRequest.create({
            data: {
                tenantId: tenant.id,
                externalId: signatureResponse.id,
                status: 'PENDING',
            },
        })

        return NextResponse.json(signatureRequest)
    } catch (error) {
        console.error('Error initiating signature:', error)
        return NextResponse.json(
            { error: "La demande de signature n'a pas pu être créée." },
            { status: 502 },
        )
    }
}
