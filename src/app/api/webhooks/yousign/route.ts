import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * Ce endpoint est le seul à être public (voir `authConfig.authorized`).
 * Sans vérification de signature, n'importe qui pouvait donc marquer un bail
 * comme « signé ». La signature HMAC de Yousign est désormais obligatoire.
 */
function verifySignature(rawBody: string, header: string | null): boolean {
    const secret = process.env.YOUSIGN_WEBHOOK_SECRET
    if (!secret) return false
    if (!header) return false

    // Yousign envoie `sha256=<hex>`.
    const received = header.startsWith('sha256=') ? header.slice('sha256='.length) : header
    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

    const receivedBuffer = Buffer.from(received, 'hex')
    const expectedBuffer = Buffer.from(expected, 'hex')
    if (receivedBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(receivedBuffer, expectedBuffer)
}

const STATUS_MAP: Record<string, string> = {
    done: 'SIGNED',
    ongoing: 'PENDING',
    draft: 'PENDING',
    refused: 'REJECTED',
    rejected: 'REJECTED',
    expired: 'EXPIRED',
    canceled: 'REJECTED',
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text()
    const signature =
        request.headers.get('x-yousign-signature-256') ?? request.headers.get('x-yousign-signature')

    if (!verifySignature(rawBody, signature)) {
        if (!process.env.YOUSIGN_WEBHOOK_SECRET) {
            console.error(
                'YOUSIGN_WEBHOOK_SECRET manquant : les webhooks Yousign sont rejetés. ' +
                    'Renseignez la variable avec le secret affiché dans la console Yousign.',
            )
        }
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    try {
        const event = JSON.parse(rawBody)
        const signatureRequest = event?.data?.signature_request

        if (!signatureRequest?.id) {
            // Événements de test / ping : rien à faire.
            return NextResponse.json({ received: true })
        }

        const internalStatus = STATUS_MAP[signatureRequest.status] ?? 'PENDING'

        // `updateMany` ne lève pas si l'identifiant externe est inconnu
        // (demande créée depuis un autre environnement, par exemple).
        const { count } = await prisma.signatureRequest.updateMany({
            where: { externalId: signatureRequest.id },
            data: { status: internalStatus },
        })

        if (count === 0) {
            console.warn(`Webhook Yousign : demande ${signatureRequest.id} inconnue en base.`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook Yousign :', error)
        // On acquitte pour éviter les rejeux en boucle côté Yousign.
        return NextResponse.json({ received: true })
    }
}
