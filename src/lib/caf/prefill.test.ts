import { buildCafPrefill, findLastPaidMonth, resolveJulyYear, type PrefillTenant } from './prefill'

const payment = (year: number, month: number, amount: number, typology = 'Loyer') => ({
    id: `${year}-${month}-${typology}`,
    amount,
    date: new Date(year, month - 1, 5, 12),
    periodStart: new Date(year, month - 1, 1, 12),
    typology,
})

const TENANT: PrefillTenant = {
    firstName: 'Sophie',
    lastName: 'Leroy',
    address: '3 impasse des Vignes',
    postalCode: '44100',
    city: 'Nantes',
    rentAmount: 890,
    chargeAmount: 110,
    startDate: new Date(2026, 0, 1, 12),
    endDate: null,
    property: {
        address: '3 impasse des Vignes',
        postalCode: '44100',
        city: 'Nantes',
        surface: 78,
        furnished: false,
        singleRoom: false,
    },
    payments: [],
}

const LANDLORD = {
    firstName: 'Marie',
    lastName: 'Martin',
    companyName: 'SCI Les Oliviers',
    email: 'marie@example.com',
    phone: '0612345678',
    address: '5 rue du Port',
    postalCode: '44000',
    city: 'Nantes',
    siret: '12345678901234',
}

const NOW = new Date(2026, 7, 12, 12)

describe('buildCafPrefill', () => {
    it('privilégie la raison sociale sur le nom du bailleur', () => {
        const data = buildCafPrefill({ tenant: TENANT, landlord: LANDLORD, now: NOW })

        expect(data.landlordName).toBe('SCI Les Oliviers')
        expect(data.landlordAddress).toBe('5 rue du Port, 44000 Nantes')
    })

    it('retombe sur le nom civil sans raison sociale', () => {
        const data = buildCafPrefill({
            tenant: TENANT,
            landlord: { ...LANDLORD, companyName: null },
            now: NOW,
        })

        expect(data.landlordName).toBe('Marie Martin')
    })

    it("reprend l'adresse du bien rattaché", () => {
        const data = buildCafPrefill({ tenant: TENANT, landlord: LANDLORD, now: NOW })

        expect(data.housingAddress).toBe('3 impasse des Vignes, 44100 Nantes')
        expect(data.surface).toBe(78)
    })

    it("utilise l'adresse du locataire quand aucun bien n'est rattaché", () => {
        const data = buildCafPrefill({
            tenant: { ...TENANT, property: null },
            landlord: LANDLORD,
            now: NOW,
        })

        expect(data.housingAddress).toBe('3 impasse des Vignes, 44100 Nantes')
        expect(data.surface).toBeNull()
    })

    it('déclare le loyer contractuel, pas le prorata du mois d’entrée', () => {
        const data = buildCafPrefill({
            tenant: { ...TENANT, startDate: new Date(2026, 0, 15, 12) },
            landlord: LANDLORD,
            now: NOW,
        })

        // Le Cerfa demande un montant « pour un mois complet ».
        expect(data.entryRent).toBe(890)
        expect(data.entryCharges).toBe(110)
        expect(data.entryMonthLabel).toBe('Janvier 2026')
    })

    it('signale un locataire à jour', () => {
        const payments = Array.from({ length: 8 }, (_, i) => payment(2026, i + 1, 1000))
        const data = buildCafPrefill({
            tenant: { ...TENANT, payments },
            landlord: LANDLORD,
            now: NOW,
        })

        expect(data.upToDate).toBe(true)
        expect(data.lastPaidMonth).toBe('')
    })

    it('signale un impayé et le dernier mois acquitté', () => {
        const payments = Array.from({ length: 5 }, (_, i) => payment(2026, i + 1, 1000))
        const data = buildCafPrefill({
            tenant: { ...TENANT, payments },
            landlord: LANDLORD,
            now: NOW,
        })

        expect(data.upToDate).toBe(false)
        expect(data.lastPaidMonth).toBe('Mai 2026')
    })

    it('ne compte pas le dépôt de garantie comme un loyer réglé', () => {
        const data = buildCafPrefill({
            tenant: { ...TENANT, payments: [payment(2026, 1, 1000, 'Depot')] },
            landlord: LANDLORD,
            now: NOW,
        })

        expect(data.upToDate).toBe(false)
    })

    it('renseigne la colocation à partir des baux actifs du bien', () => {
        const data = buildCafPrefill({
            tenant: TENANT,
            landlord: LANDLORD,
            coTenants: [{ firstName: 'Karim', lastName: 'Benali' }],
            now: NOW,
        })

        expect(data.coTenancy).toBe(true)
        expect(data.coTenantsCount).toBe(2)
        expect(data.tenant2).toBe('Karim Benali')
        expect(data.coTenancyTotal).toBe(1000)
    })

    it('renseigne les loyers de juillet quand le bail couvre ce mois', () => {
        const data = buildCafPrefill({ tenant: TENANT, landlord: LANDLORD, now: NOW })

        expect(data.julyYear).toBe(2026)
        expect(data.julyRent).toBe(890)
        expect(data.julyCharges).toBe(110)
    })

    it('laisse la rubrique de juillet entièrement vierge si aucun juillet n’est couvert', () => {
        // Bail démarré en août : un montant en face d'une année vide serait
        // incohérent sur la déclaration.
        const data = buildCafPrefill({
            tenant: { ...TENANT, startDate: new Date(2026, 7, 9, 12) },
            landlord: LANDLORD,
            now: NOW,
        })

        expect(data.julyYear).toBeNull()
        expect(data.julyRent).toBeNull()
        expect(data.julyCharges).toBeNull()
    })

    it('laisse le versement direct non renseigné', () => {
        const data = buildCafPrefill({ tenant: TENANT, landlord: LANDLORD, now: NOW })

        // Ce choix appartient au bailleur : rien ne doit être pré-coché.
        expect(data.directPayment).toBeNull()
    })

    it('fonctionne sans profil bailleur enregistré', () => {
        const data = buildCafPrefill({ tenant: TENANT, landlord: null, now: NOW })

        expect(data.landlordName).toBe('')
        expect(data.landlordSiret).toBe('')
    })
})

describe('resolveJulyYear', () => {
    it('retient le juillet de l’année en cours pour un bail actif', () => {
        expect(resolveJulyYear({ startDate: new Date(2024, 0, 1), endDate: null }, NOW)).toBe(2026)
    })

    it('retient le dernier juillet couvert par un bail terminé', () => {
        expect(
            resolveJulyYear(
                { startDate: new Date(2023, 0, 1), endDate: new Date(2025, 9, 31) },
                NOW,
            ),
        ).toBe(2025)
    })

    it('ne propose rien si le bail ne couvre aucun mois de juillet', () => {
        expect(
            resolveJulyYear(
                { startDate: new Date(2026, 7, 1), endDate: new Date(2026, 10, 30) },
                NOW,
            ),
        ).toBeNull()
    })
})

describe('findLastPaidMonth', () => {
    it('retourne une chaîne vide sans aucun mois soldé', () => {
        expect(findLastPaidMonth(TENANT, NOW)).toBe('')
    })
})
