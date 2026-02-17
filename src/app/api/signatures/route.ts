
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { initiateSignatureRequest } from '@/lib/yousign';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const tenantId = formData.get('tenantId') as string;
        const file = formData.get('file') as File;

        if (!tenantId || !file) {
            return NextResponse.json({ error: 'Missing tenantId or file' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Initiate Signature via Yousign
        const signatureResponse = await initiateSignatureRequest(
            buffer,
            file.name,
            {
                firstName: tenant.firstName,
                lastName: tenant.lastName,
                email: tenant.email || '',
                phone: tenant.phone || undefined,
            }
        );

        // Save request to Database
        const signatureRequest = await prisma.signatureRequest.create({
            data: {
                tenantId: tenant.id,
                externalId: signatureResponse.id,
                status: signatureResponse.status, // 'ongoing' usually
            },
        });

        return NextResponse.json(signatureRequest);

    } catch (error: any) {
        console.error('Error initiating signature:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
