
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSignatureRequestStatus } from '@/lib/yousign';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const signatureRequestId = params.id;

    try {
        const signatureRequest = await prisma.signatureRequest.findUnique({
            where: { id: signatureRequestId },
        });

        if (!signatureRequest || !signatureRequest.externalId) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
        }

        // Fetch status from Yousign
        const yousignStatus = await getSignatureRequestStatus(signatureRequest.externalId);

        // Map Yousign status to our status
        // Yousign statuses: 'draft', 'ongoing', 'done', 'expired', 'refused' (rejected)
        let newStatus = signatureRequest.status;
        if (yousignStatus.status === 'done') newStatus = 'SIGNED';
        else if (yousignStatus.status === 'refused') newStatus = 'REJECTED';
        else if (yousignStatus.status === 'expired') newStatus = 'EXPIRED';
        else if (yousignStatus.status === 'ongoing') newStatus = 'PENDING';

        // Update DB if changed
        if (newStatus !== signatureRequest.status) {
            await prisma.signatureRequest.update({
                where: { id: signatureRequestId },
                data: { status: newStatus },
            });
        }

        return NextResponse.json({ ...signatureRequest, status: newStatus, raw: yousignStatus });

    } catch (error: any) {
        console.error('Error checking signature status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
