import { cafAttestationSchema, toFormValues } from './schema'
import type { CafAttestationData } from './fill'

describe('cafAttestationSchema', () => {
    it('accepte un payload entièrement vide', () => {
        // Une génération ne doit jamais échouer parce qu'une rubrique manque :
        // le champ reste simplement vierge sur le document.
        const result = cafAttestationSchema.safeParse({})

        expect(result.success).toBe(true)
        expect(result.data?.landlordName).toBe('')
        expect(result.data?.startDate).toBeNull()
        expect(result.data?.decency).toBeNull()
        expect(result.data?.furnished).toBe(false)
    })

    it('convertit les réponses oui/non en booléens', () => {
        const result = cafAttestationSchema.safeParse({
            singleRoom: 'oui',
            coTenancy: 'non',
            decency: '',
        })

        expect(result.data?.singleRoom).toBe(true)
        expect(result.data?.coTenancy).toBe(false)
        expect(result.data?.decency).toBeNull()
    })

    it('accepte les montants saisis à la française', () => {
        const result = cafAttestationSchema.safeParse({ entryRent: '1 234,56' })

        expect(result.data?.entryRent).toBeCloseTo(1234.56)
    })

    it('rejette un montant non numérique', () => {
        const result = cafAttestationSchema.safeParse({ entryRent: 'beaucoup' })

        expect(result.success).toBe(false)
        expect(result.error?.issues[0].message).toBe('Montant invalide.')
    })

    it('rejette un montant négatif', () => {
        expect(cafAttestationSchema.safeParse({ entryCharges: '-5' }).success).toBe(false)
    })

    it('ignore une date mal formée plutôt que d’échouer', () => {
        const result = cafAttestationSchema.safeParse({ startDate: '15/01/2026' })

        expect(result.success).toBe(true)
        expect(result.data?.startDate).toBeNull()
    })

    it('interprète la date sans décalage de fuseau', () => {
        const result = cafAttestationSchema.safeParse({ startDate: '2026-01-15' })

        expect(result.data?.startDate?.getDate()).toBe(15)
        expect(result.data?.startDate?.getMonth()).toBe(0)
    })
})

describe('toFormValues', () => {
    it('fait l’aller-retour avec le schéma', () => {
        const data: CafAttestationData = {
            landlordName: 'SCI Les Oliviers',
            landlordAddress: '5 rue du Port',
            landlordPhone: '0612345678',
            landlordFax: '',
            landlordEmail: 'marie@example.com',
            landlordSiret: '12345678901234',
            tenant1: 'Sophie Leroy',
            tenant2: '',
            startDate: new Date(2026, 0, 15, 12),
            housingAddress: '3 impasse des Vignes',
            singleRoom: false,
            surface: 78,
            coTenancy: null,
            coTenantsCount: null,
            coTenancyTotal: null,
            furnished: true,
            entryMonthLabel: 'Janvier 2026',
            entryRent: 890,
            entryCharges: 110,
            julyYear: 2026,
            julyRent: 890,
            julyCharges: 110,
            upToDate: true,
            lastPaidMonth: '',
            sublet: false,
            hotel: false,
            directPayment: null,
            decency: true,
            signaturePlace: 'Nantes',
            signatureDate: new Date(2026, 7, 12, 12),
        }

        const parsed = cafAttestationSchema.parse(toFormValues(data))

        expect(parsed).toEqual(data)
    })
})
