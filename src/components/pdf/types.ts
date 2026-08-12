/**
 * Formes minimales attendues par les documents PDF.
 *
 * Volontairement plus larges que les modèles Prisma : les templates ne
 * doivent dépendre que des champs qu'ils impriment réellement.
 */

export interface PdfProperty {
    name: string
    type?: string
    address: string
    postalCode: string
    city: string
}

export interface PdfTenant {
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    address: string
    postalCode: string
    city: string
    rentAmount: number
    chargeAmount: number
    startDate: Date
    endDate?: Date | null
    property?: PdfProperty | null
}

export interface PdfLandlord {
    firstName?: string | null
    lastName?: string | null
    companyName?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    postalCode?: string | null
    city?: string | null
    siret?: string | null
}
