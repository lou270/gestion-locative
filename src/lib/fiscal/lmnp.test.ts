import {
    ABATTEMENT_MINIMUM,
    buildFiscalSummary,
    computeMicroBic,
    computeReel,
    NON_AFFECTE,
    recommendRegime,
    type FiscalExpense,
    type FiscalPayment,
} from './lmnp'

const YEAR = 2025

const payment = (overrides: Partial<FiscalPayment> = {}): FiscalPayment => ({
    amount: 650,
    date: new Date(YEAR, 0, 5, 12),
    typology: 'Loyer',
    periodStart: new Date(YEAR, 0, 1, 12),
    periodEnd: new Date(YEAR, 0, 31, 12),
    tenantId: 'tenant-1',
    tenantName: 'Dupont Marie',
    propertyId: 'prop-1',
    propertyName: 'Appartement Centre',
    ...overrides,
})

const expense = (overrides: Partial<FiscalExpense> = {}): FiscalExpense => ({
    id: 'exp-1',
    amount: 900,
    date: new Date(YEAR, 9, 15, 12),
    category: 'TaxeFonciere',
    label: 'Taxe foncière 2025',
    note: null,
    propertyId: 'prop-1',
    propertyName: 'Appartement Centre',
    ...overrides,
})

describe('buildFiscalSummary — recettes', () => {
    it('exclut le dépôt de garantie et inclut la CAF', () => {
        const summary = buildFiscalSummary({
            year: YEAR,
            payments: [
                payment({ amount: 650, typology: 'Loyer' }),
                payment({ amount: 300, typology: 'CAF' }),
                payment({ amount: 120, typology: 'Regularisation' }),
                payment({ amount: 1300, typology: 'Depot' }),
            ],
            expenses: [],
        })

        // Le dépôt est détenu pour le compte du locataire, ce n'est pas un revenu.
        expect(summary.recettes.total).toBe(1070)
        expect(summary.recettes.nombre).toBe(3)
        expect(summary.recettes.parTypologie.map((r) => r.cle)).not.toContain('Depot')
    })

    it('répartit les recettes par typologie et par locataire', () => {
        const summary = buildFiscalSummary({
            year: YEAR,
            payments: [
                payment({ amount: 600, tenantId: 't1', tenantName: 'Dupont Marie' }),
                payment({ amount: 400, tenantId: 't2', tenantName: 'Martin Paul' }),
            ],
            expenses: [],
        })

        expect(summary.recettes.parLocataire).toHaveLength(2)
        expect(summary.recettes.parLocataire[0]).toMatchObject({
            libelle: 'Dupont Marie',
            montant: 600,
            part: 60,
            nombre: 1,
        })
    })
})

describe('buildFiscalSummary — répartition par bien', () => {
    it('regroupe les mouvements sans bien sous « Non affecté », en dernier', () => {
        const summary = buildFiscalSummary({
            year: YEAR,
            payments: [payment({ amount: 1000 })],
            expenses: [
                expense({ amount: 900 }),
                expense({
                    id: 'exp-2',
                    amount: 250,
                    category: 'CFE',
                    label: 'CFE 2025',
                    propertyId: null,
                    propertyName: null,
                }),
            ],
        })

        expect(summary.parBien).toHaveLength(2)
        expect(summary.parBien[0]).toMatchObject({
            libelle: 'Appartement Centre',
            recettes: 1000,
            charges: 900,
            resultat: 100,
        })
        expect(summary.parBien[1]).toMatchObject({
            propertyId: null,
            libelle: NON_AFFECTE,
            recettes: 0,
            charges: 250,
            resultat: -250,
        })
    })
})

describe('computeMicroBic', () => {
    it('applique un abattement de 50 % en location longue durée', () => {
        const micro = computeMicroBic(20_000, YEAR, 'longue-duree')

        expect(micro.abattement).toBe(10_000)
        expect(micro.resultat).toBe(10_000)
        expect(micro.eligible).toBe(true)
    })

    it("applique l'abattement plancher quand il est plus favorable", () => {
        const micro = computeMicroBic(500, YEAR, 'longue-duree')

        // 50 % de 500 € = 250 €, inférieur au plancher légal.
        expect(micro.abattement).toBe(ABATTEMENT_MINIMUM)
        expect(micro.abattementPlancherApplique).toBe(true)
        expect(micro.resultat).toBe(195)
    })

    it("ne laisse jamais l'abattement dépasser les recettes", () => {
        const micro = computeMicroBic(200, YEAR, 'longue-duree')

        // Sans plafonnement, le résultat serait de −105 €, ce qui n'existe pas
        // au micro-BIC.
        expect(micro.abattement).toBe(200)
        expect(micro.resultat).toBe(0)
    })

    it('signale le dépassement du plafond de recettes', () => {
        const micro = computeMicroBic(80_000, YEAR, 'longue-duree')

        expect(micro.plafondDepasse).toBe(true)
        expect(micro.eligible).toBe(false)
    })

    it('applique un barème distinct au meublé de tourisme non classé', () => {
        const micro = computeMicroBic(20_000, YEAR, 'tourisme-non-classe')

        expect(micro.tauxAbattement).toBe(0.3)
        expect(micro.plafondDepasse).toBe(true)
    })

    it('ne compte aucun abattement sur des recettes nulles', () => {
        const micro = computeMicroBic(0, YEAR, 'longue-duree')

        expect(micro.abattement).toBe(0)
        expect(micro.resultat).toBe(0)
        expect(micro.abattementPlancherApplique).toBe(false)
    })
})

describe('computeReel', () => {
    it('soustrait les charges des recettes', () => {
        expect(computeReel(20_000, 8_000)).toMatchObject({ resultat: 12_000, deficit: false })
    })

    it('signale un déficit', () => {
        expect(computeReel(5_000, 8_000)).toMatchObject({ resultat: -3_000, deficit: true })
    })
})

describe('recommendRegime', () => {
    it("ne compare rien sur une année sans mouvement", () => {
        const reco = recommendRegime(
            computeMicroBic(0, YEAR, 'longue-duree'),
            computeReel(0, 0),
        )

        expect(reco.comparable).toBe(false)
        expect(reco.ecart).toBe(0)
        expect(reco.message).toMatch(/rien à comparer/)
    })

    it('compare dès qu’une charge est saisie, même sans recette', () => {
        const reco = recommendRegime(
            computeMicroBic(0, YEAR, 'longue-duree'),
            computeReel(0, 900),
        )

        expect(reco.comparable).toBe(true)
        expect(reco.regime).toBe('reel')
    })

    it('conclut avec certitude quand le réel gagne déjà sans amortissements', () => {
        const reco = recommendRegime(
            computeMicroBic(20_000, YEAR, 'longue-duree'),
            computeReel(20_000, 15_000),
        )

        expect(reco.regime).toBe('reel')
        expect(reco.certaine).toBe(true)
        expect(reco.ecart).toBe(5_000)
    })

    it('reste prudent quand le micro-BIC gagne', () => {
        const reco = recommendRegime(
            computeMicroBic(20_000, YEAR, 'longue-duree'),
            computeReel(20_000, 3_000),
        )

        expect(reco.regime).toBe('micro-bic')
        // Les amortissements, non calculés, inversent souvent ce verdict.
        expect(reco.certaine).toBe(false)
        expect(reco.message).toMatch(/amortissements/)
    })

    it('impose le réel quand le plafond est dépassé', () => {
        const reco = recommendRegime(
            computeMicroBic(80_000, YEAR, 'longue-duree'),
            computeReel(80_000, 1_000),
        )

        expect(reco.regime).toBe('reel')
        expect(reco.obligatoire).toBe(true)
        expect(reco.certaine).toBe(true)
    })
})

describe('buildFiscalSummary — alertes et barème', () => {
    it('alerte au-delà du seuil de 23 000 € sans affirmer le statut LMP', () => {
        const summary = buildFiscalSummary({
            year: YEAR,
            payments: [payment({ amount: 25_000 })],
            expenses: [],
        })

        const alerte = summary.alertes.find((a) => a.includes('LMP'))
        expect(alerte).toBeDefined()
        expect(alerte).toMatch(/à vérifier/)
    })

    it('signale une année postérieure au dernier barème connu', () => {
        const summary = buildFiscalSummary({ year: 2099, payments: [], expenses: [] })

        expect(summary.baremeADefaut).toBe(true)
        expect(summary.alertes.some((a) => a.includes('2099'))).toBe(true)
    })

    it('reste stable sans aucun mouvement', () => {
        const summary = buildFiscalSummary({ year: YEAR, payments: [], expenses: [] })

        expect(summary.recettes.total).toBe(0)
        expect(summary.charges.total).toBe(0)
        expect(summary.microBic.resultat).toBe(0)
        expect(summary.reel.resultat).toBe(0)
        expect(summary.parBien).toHaveLength(0)
    })
})

describe('buildFiscalSummary — arrondis', () => {
    it('ne laisse pas fuiter les artefacts de virgule flottante', () => {
        const summary = buildFiscalSummary({
            year: YEAR,
            payments: [payment({ amount: 0.1 }), payment({ amount: 0.2 })],
            expenses: [expense({ amount: 0.1 }), expense({ id: 'exp-2', amount: 0.2 })],
        })

        expect(summary.recettes.total).toBe(0.3)
        expect(summary.charges.total).toBe(0.3)
        expect(summary.reel.resultat).toBe(0)
    })
})
