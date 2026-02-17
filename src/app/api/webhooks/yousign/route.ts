
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const event = await request.json();

        // Event types: "signature_request.started", "signature_request.finished", "signature_request.refused", etc.
        // Yousign v3 webhook format: event_name, data object

        const eventName = event.event_name;
        // Check if data exists and has signature_request
        if (!event.data || !event.data.signature_request) {
            // Some events might just be ping or other types
            return NextResponse.json({ received: true });
        }

        const signatureRequestId = event.data.signature_request.id;
        const status = event.data.signature_request.status; // 'ongoing', 'done', 'draft', etc.

        console.log(`Received Webhook: ${eventName} for ${signatureRequestId} status: ${status}`);

        // Map Yousign status to our status
        let internalStatus = 'PENDING';
        if (status === 'done') internalStatus = 'SIGNED';
        if (status === 'refused' || status === 'rejected' || status === 'expired') internalStatus = 'REJECTED';
        if (status === 'ongoing') internalStatus = 'PENDING';

        // We update using externalId (the Yousign ID)
        await prisma.signatureRequest.update({
            where: { externalId: signatureRequestId },
            data: {
                status: internalStatus,
            }
        });

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        // Always return 200 to Yousign to acknowledge receipt, unless it's a critical server error
        // but useful to log it.
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
