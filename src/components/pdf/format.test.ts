import { euros, frDate, landlordName, madeAt, withElision } from './format'

describe('euros', () => {
    it('formate à la française avec le symbole', () => {
        // `Intl` insérerait une espace fine insécable, absente de l'encodage
        // WinAnsi des polices PDF standard.
        expect(euros(680)).toBe('680,00 €')
        expect(euros(1234.5)).toBe('1234,50 €')
    })

    it('traite une valeur absente comme zéro', () => {
        expect(euros(null)).toBe('0,00 €')
        expect(euros(undefined)).toBe('0,00 €')
        expect(euros(NaN)).toBe('0,00 €')
    })
})

describe('frDate', () => {
    it('formate en jj/mm/aaaa', () => {
        expect(frDate(new Date(2026, 2, 5, 12))).toBe('05/03/2026')
    })

    it('rend une chaîne vide pour une date absente ou invalide', () => {
        expect(frDate(null)).toBe('')
        expect(frDate('pas une date')).toBe('')
    })
})

describe('landlordName', () => {
    it('privilégie la raison sociale', () => {
        expect(
            landlordName({ companyName: 'SCI Les Oliviers', firstName: 'Marie', lastName: 'Martin' }),
        ).toBe('SCI Les Oliviers')
    })

    it("retombe sur l'état civil", () => {
        expect(landlordName({ companyName: '  ', firstName: 'Marie', lastName: 'Martin' })).toBe(
            'Marie Martin',
        )
    })

    it('rend une chaîne vide sans bailleur enregistré', () => {
        expect(landlordName(null)).toBe('')
    })
})

describe('madeAt', () => {
    it('mentionne la ville du bailleur', () => {
        expect(madeAt('Rezé', new Date(2026, 2, 5, 12))).toBe('Fait à Rezé, le 05/03/2026')
    })

    it("omet le lieu plutôt que d'en inventer un", () => {
        // La mention était figée sur « Paris », quelle que soit la ville réelle.
        expect(madeAt(null, new Date(2026, 2, 5, 12))).toBe('Le 05/03/2026')
        expect(madeAt('   ', new Date(2026, 2, 5, 12))).toBe('Le 05/03/2026')
    })
})

describe('withElision', () => {
    it('élide devant une voyelle', () => {
        expect(withElision('Alice Bernard')).toBe("d'Alice Bernard")
        expect(withElision('Élodie Roy')).toBe("d'Élodie Roy")
    })

    it('conserve « de » devant une consonne', () => {
        expect(withElision('Marc Durand')).toBe('de Marc Durand')
    })

    it('élide devant un h', () => {
        expect(withElision('Hugo Petit')).toBe("d'Hugo Petit")
    })
})
