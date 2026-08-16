/**
 * Client de l'API Yousign v3 (signature électronique du bail).
 *
 * Les erreurs remontées aux appelants restent génériques : le corps d'erreur
 * d'un service tiers peut contenir des identifiants de compte ou des fragments
 * de la requête envoyée. Il est journalisé côté serveur pour le diagnostic,
 * jamais propagé dans un message susceptible d'atteindre le navigateur.
 */

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY
const YOUSIGN_API_URL = process.env.YOUSIGN_API_URL || 'https://api-sandbox.yousign.app/v3'

interface Signer {
    firstName: string
    lastName: string
    email: string
    phone?: string
}

function requireApiKey(): string {
    if (!YOUSIGN_API_KEY) {
        throw new Error("YOUSIGN_API_KEY n'est pas renseignée : la signature est indisponible.")
    }
    return YOUSIGN_API_KEY
}

/**
 * Journalise le détail d'un échec et lève un message neutre.
 *
 * `response.text()` consomme le corps : on ne l'appelle qu'ici, une seule fois
 * par réponse.
 */
async function throwApiError(step: string, response: Response): Promise<never> {
    const detail = await response.text().catch(() => '')
    console.error(`Yousign – ${step} : ${response.status} ${detail}`)
    throw new Error(`Yousign a refusé l'opération « ${step} » (HTTP ${response.status}).`)
}

/**
 * Normalise un numéro français en E.164, format attendu par Yousign.
 * Retourne `undefined` si aucun numéro n'est fourni : la demande bascule alors
 * en signature sans OTP.
 */
function toE164(phone: string | undefined): string | undefined {
    if (!phone) return undefined
    const compact = phone.replace(/[\s.-]/g, '')
    if (!compact) return undefined
    return compact.startsWith('0') ? `+33${compact.slice(1)}` : compact
}

export async function initiateSignatureRequest(
    fileBuffer: Buffer,
    fileName: string,
    signer: Signer,
) {
    const apiKey = requireApiKey()
    const authorization = { Authorization: `Bearer ${apiKey}` }
    const jsonHeaders = { ...authorization, 'Content-Type': 'application/json' }

    // 1. Création de la demande
    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            name: `Bail - ${signer.firstName} ${signer.lastName}`,
            delivery_mode: 'email',
            timezone: 'Europe/Paris',
        }),
    })

    if (!response.ok) await throwApiError('création de la demande', response)

    const signatureRequest = await response.json()
    const signatureRequestId = signatureRequest.id

    // 2. Téléversement du document
    const formData = new FormData()
    const blob = new Blob([fileBuffer as unknown as BlobPart])
    formData.append('file', blob, fileName)
    formData.append('nature', 'signable_document')
    // Les emplacements de signature sont repérés par ancres dans le PDF.
    formData.append('parse_anchors', 'true')

    const docResponse = await fetch(
        `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents`,
        { method: 'POST', headers: authorization, body: formData },
    )

    if (!docResponse.ok) await throwApiError('téléversement du document', docResponse)

    // 3. Ajout du signataire
    const phoneNumber = toE164(signer.phone)

    const signerResponse = await fetch(
        `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/signers`,
        {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
                info: {
                    first_name: signer.firstName,
                    last_name: signer.lastName,
                    email: signer.email,
                    phone_number: phoneNumber,
                    locale: 'fr',
                },
                signature_level: 'electronic_signature',
                // Sans numéro de téléphone, l'OTP par SMS est impossible.
                signature_authentication_mode: phoneNumber ? 'otp_sms' : 'no_otp',
            }),
        },
    )

    if (!signerResponse.ok) await throwApiError('ajout du signataire', signerResponse)

    // 4. Activation : déclenche l'envoi du courriel au locataire
    const activateResponse = await fetch(
        `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/activate`,
        { method: 'POST', headers: jsonHeaders },
    )

    if (!activateResponse.ok) await throwApiError('activation de la demande', activateResponse)

    return {
        id: signatureRequestId,
        status: 'ongoing',
    }
}

export async function getSignatureRequestStatus(signatureRequestId: string) {
    const apiKey = requireApiKey()

    const response = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    })

    if (!response.ok) await throwApiError('lecture du statut', response)

    return await response.json()
}

/** Récupère le PDF signé, en binaire. */
export async function downloadSignedDocument(signatureRequestId: string) {
    const apiKey = requireApiKey()

    const response = await fetch(
        `${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents/download`,
        {
            method: 'GET',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        },
    )

    if (!response.ok) await throwApiError('téléchargement du document signé', response)

    return await response.arrayBuffer()
}
