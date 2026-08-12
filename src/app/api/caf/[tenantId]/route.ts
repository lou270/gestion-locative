import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { guardApiRoute } from '@/lib/api-guard'
import { fillCafAttestation } from '@/lib/caf/fill'
import { cafAttestationSchema } from '@/lib/caf/schema'
import { verifyCafForm } from '@/lib/caf/verify'
import { safeFilename } from '@/lib/pdf-response'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 Mo

/**
 * Remplit l'attestation de loyer CAF (Cerfa 10842*07) téléversée pour un
 * locataire.
 *
 * Le formulaire n'est pas stocké : chaque demande de la CAF est nominative
 * (matricule et code-barres pré-imprimés), le bailleur téléverse donc le
 * document reçu à chaque fois et récupère aussitôt la version remplie.
 */
export async function POST(request: NextRequest, props: { params: Promise<{ tenantId: string }> }) {
    const denied = await guardApiRoute()
    if (denied) return denied

    const { tenantId } = await props.params

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Requête illisible.' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Aucun formulaire CAF téléversé.' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Le formulaire doit être un PDF.' }, { status: 400 })
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: 'Le PDF doit faire entre 1 octet et 15 Mo.' },
            { status: 400 },
        )
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
        return NextResponse.json({ error: 'Locataire introuvable.' }, { status: 404 })
    }

    const values: Record<string, unknown> = {}
    formData.forEach((value, key) => {
        if (key !== 'file' && typeof value === 'string') values[key] = value
    })

    const parsed = cafAttestationSchema.safeParse(values)
    if (!parsed.success) {
        const issue = parsed.error.issues[0]
        return NextResponse.json(
            { error: `${issue.path.join('.') || 'Formulaire'} : ${issue.message}` },
            { status: 400 },
        )
    }

    const bytes = new Uint8Array(await file.arrayBuffer())

    // Le remplissage se fait à des coordonnées figées : sur un autre document,
    // les informations tomberaient en face des mauvaises rubriques.
    const verification = await verifyCafForm(bytes)
    if (!verification.ok) {
        return NextResponse.json({ error: verification.reason }, { status: 422 })
    }

    try {
        const filled = await fillCafAttestation(bytes, parsed.data)
        const filename = safeFilename(
            `attestation-loyer-caf-${tenant.lastName}-${tenant.firstName}`,
            'attestation-loyer-caf',
        )

        return new NextResponse(new Uint8Array(filled), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}.pdf"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (error) {
        console.error('Failed to fill CAF attestation:', error)
        return NextResponse.json(
            { error: "Le remplissage de l'attestation a échoué." },
            { status: 500 },
        )
    }
}
