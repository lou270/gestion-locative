import { buildPaymentHistory, getTenantBalance, type LedgerPayment } from '@/lib/ledger'
import { formatMonthYear } from '@/lib/format'
import type { CafAttestationData } from './fill'

/**
 * Valeurs proposées par défaut dans l'attestation de loyer, déduites du
 * dossier locataire. Elles restent toutes modifiables avant génération :
 * certaines rubriques du Cerfa (sous-location, versement direct, décence)
 * relèvent d'une déclaration du bailleur et non d'une donnée en base.
 */

export interface PrefillTenant {
    firstName: string
    lastName: string
    address: string
    postalCode: string
    city: string
    rentAmount: number
    chargeAmount: number
    startDate: Date
    endDate: Date | null
    property: {
        address: string
        postalCode: string
        city: string
        surface: number | null
        furnished: boolean
        singleRoom: boolean
    } | null
    payments: LedgerPayment[]
}

export interface PrefillLandlord {
    firstName: string | null
    lastName: string | null
    companyName: string | null
    email: string | null
    phone: string | null
    address: string | null
    postalCode: string | null
    city: string | null
    siret: string | null
}

/** Autres locataires actifs du même bien, pour la rubrique colocation. */
export interface PrefillCoTenant {
    firstName: string
    lastName: string
}

export function buildCafPrefill({
    tenant,
    landlord,
    coTenants = [],
    now = new Date(),
}: {
    tenant: PrefillTenant
    landlord: PrefillLandlord | null
    coTenants?: PrefillCoTenant[]
    now?: Date
}): CafAttestationData {
    const property = tenant.property

    const landlordName =
        landlord?.companyName?.trim() ||
        [landlord?.firstName, landlord?.lastName].filter(Boolean).join(' ').trim()

    const landlordAddress = [
        landlord?.address,
        [landlord?.postalCode, landlord?.city].filter(Boolean).join(' '),
    ]
        .filter(Boolean)
        .join(', ')

    const housingAddress = property
        ? `${property.address}, ${property.postalCode} ${property.city}`
        : `${tenant.address}, ${tenant.postalCode} ${tenant.city}`

    const coTenancy = coTenants.length > 0
    const { balance } = getTenantBalance(tenant, tenant.payments, now)
    const upToDate = balance >= -0.01
    const julyYear = resolveJulyYear(tenant, now)

    return {
        landlordName,
        landlordAddress,
        landlordPhone: landlord?.phone ?? '',
        landlordFax: '',
        landlordEmail: landlord?.email ?? '',
        landlordSiret: landlord?.siret ?? '',

        tenant1: `${tenant.firstName} ${tenant.lastName}`,
        tenant2: coTenants[0] ? `${coTenants[0].firstName} ${coTenants[0].lastName}` : '',
        startDate: tenant.startDate,
        housingAddress,

        singleRoom: property?.singleRoom ?? false,
        surface: property?.surface ?? null,
        coTenancy,
        coTenantsCount: coTenancy ? coTenants.length + 1 : null,
        coTenancyTotal: coTenancy ? tenant.rentAmount + tenant.chargeAmount : null,
        furnished: property?.furnished ?? false,

        // Le Cerfa demande un mois *complet* : on déclare le loyer contractuel,
        // pas le prorata effectivement dû le mois de l'emménagement.
        entryMonthLabel: formatMonthYear(tenant.startDate),
        entryRent: tenant.rentAmount,
        entryCharges: tenant.chargeAmount,

        // Sans mois de juillet couvert par le bail, la rubrique reste
        // entièrement vierge : un montant en face d'une année vide serait
        // incohérent sur la déclaration.
        julyYear,
        julyRent: julyYear === null ? null : tenant.rentAmount,
        julyCharges: julyYear === null ? null : tenant.chargeAmount,

        upToDate,
        lastPaidMonth: upToDate ? '' : findLastPaidMonth(tenant, now),
        sublet: false,
        hotel: false,
        // Le versement direct de l'aide au bailleur est un choix du bailleur :
        // la rubrique reste vierge tant qu'il ne s'est pas prononcé.
        directPayment: null,
        decency: true,

        signaturePlace: landlord?.city ?? '',
        signatureDate: now,
    }
}

/**
 * Millésime attendu à la rubrique « mois de juillet » : le dernier mois de
 * juillet couvert par le bail, ou `null` si le bail n'en couvre aucun.
 */
export function resolveJulyYear(
    tenant: Pick<PrefillTenant, 'startDate' | 'endDate'>,
    now: Date,
): number | null {
    const start = new Date(tenant.startDate)
    const lastCovered = tenant.endDate ? new Date(tenant.endDate) : now

    for (let year = lastCovered.getFullYear(); year >= start.getFullYear(); year--) {
        const july = new Date(year, 6, 1, 12)
        const julyEnd = new Date(year, 6, 31, 12)
        if (julyEnd < start) return null
        if (july <= lastCovered) return year
    }

    return null
}

/** Dernier mois intégralement acquitté, pour la rubrique des impayés. */
export function findLastPaidMonth(tenant: PrefillTenant, now: Date): string {
    const history = buildPaymentHistory(tenant, tenant.payments, { now, monthsAhead: 0 })
    const paid = history.find((month) => month.status === 'Paid')
    return paid ? formatMonthYear(paid.date) : ''
}
