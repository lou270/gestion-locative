
const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY;
const YOUSIGN_API_URL = process.env.YOUSIGN_API_URL || 'https://api-sandbox.yousign.app/v3';

interface Signer {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}



export async function initiateSignatureRequest(
    fileBuffer: Buffer,
    fileName: string,
    signer: Signer
) {
    if (!YOUSIGN_API_KEY) {
        throw new Error("YOUSIGN_API_KEY is not defined");
    }

    // 1. Initiate Signature Request
    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: `Bail - ${signer.firstName} ${signer.lastName}`,
            delivery_mode: 'email',
            timezone: 'Europe/Paris',
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create signature request: ${response.status} ${errorBody}`);
    }

    const signatureRequest = await response.json();
    const signatureRequestId = signatureRequest.id;

    // 2. Upload Document
    // Note: specific implementation depends on how Yousign expects the file. 
    // Usually multipart/form-data for document upload.
    const formData = new FormData();
    const blob = new Blob([fileBuffer as unknown as BlobPart]);
    formData.append('file', blob, fileName);
    formData.append('nature', 'signable_document');
    formData.append('parse_anchors', 'true'); // If we use anchors in the PDF

    const docResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        },
        body: formData,
    });

    if (!docResponse.ok) {
        throw new Error(`Failed to upload document: ${docResponse.status}`);
    }



    // 3. Add Signer
    // Normalize phone number to E.164 if present
    let phoneNumber = signer.phone;
    if (phoneNumber && phoneNumber.startsWith('0')) {
        phoneNumber = '+33' + phoneNumber.substring(1);
    }
    phoneNumber = phoneNumber?.replace(/\s/g, ''); // Remove spaces

    const authMode = phoneNumber ? 'otp_sms' : 'no_otp';

    const signerBody = {
        info: {
            first_name: signer.firstName,
            last_name: signer.lastName,
            email: signer.email,
            phone_number: phoneNumber,
            locale: 'fr',
        },
        signature_level: 'electronic_signature',
        signature_authentication_mode: authMode
    };

    const signerResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/signers`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(signerBody),
    });

    if (!signerResponse.ok) {
        const errText = await signerResponse.text();
        console.error("Yousign Add Signer Error:", errText);
        throw new Error(`Failed to add signer: ${signerResponse.status} - ${errText}`);
    }

    // 4. Activate Request
    const activateResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/activate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!activateResponse.ok) {
        throw new Error(`Failed to activate signature request: ${activateResponse.status}`);
    }

    return {
        id: signatureRequestId,
        status: 'ongoing',
    };
}

export async function getSignatureRequestStatus(signatureRequestId: string) {
    if (!YOUSIGN_API_KEY) {
        throw new Error("YOUSIGN_API_KEY is not defined");
    }

    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
    }

    return await response.json();
}

export async function downloadSignedDocument(signatureRequestId: string) {
    if (!YOUSIGN_API_KEY) {
        throw new Error("YOUSIGN_API_KEY is not defined");
    }

    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents/download`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status}`);
    }

    // Returns binary buffer
    return await response.arrayBuffer();
}
