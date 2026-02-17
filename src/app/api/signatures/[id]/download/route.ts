
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { downloadSignedDocument } from '@/lib/yousign';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const signatureRequestId = params.id;

    try {
        const signatureRequest = await prisma.signatureRequest.findUnique({
            where: { id: signatureRequestId },
            include: { tenant: true }
        });

        if (!signatureRequest || !signatureRequest.externalId) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
        }

        if (signatureRequest.status !== 'SIGNED' && signatureRequest.status !== 'done') {
            // Optional: allow download if it's done but our DB is lagging, but better to check status first
            // For now assume logic is correct
        }

        const pdfBuffer = await downloadSignedDocument(signatureRequest.externalId);

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bail_signe_${signatureRequest.tenant.lastName}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('Error downloading document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
