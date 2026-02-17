
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { LeaseDocument } from '@/components/pdf/LeaseTemplate';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const params = await props.params;
    const tenantId = params.tenantId;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { property: true }
    });

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const landlord = await prisma.landlord.findFirst();

    const stream = await renderToStream(
        LeaseDocument({
            tenant,
            landlord,
            property: tenant.property,
            date: new Date()
        })
    );

    return new NextResponse(stream as unknown as ReadableStream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="bail-location-${tenant.lastName}.pdf"`,
        },
    });
}
