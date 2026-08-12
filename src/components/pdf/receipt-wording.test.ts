import { buildReceiptDeclaration } from './format'

const PERIOD = { start: new Date(2026, 2, 1, 12), end: new Date(2026, 2, 31, 12) }

const declaration = (overrides: Partial<Parameters<typeof buildReceiptDeclaration>[0]> = {}) =>
    buildReceiptDeclaration({
        bailleur: 'SCI Les Oliviers',
        locataire: 'Alice Bernard',
        paidByTenant: 680,
        cafAmount: 0,
        period: PERIOD,
        ...overrides,
    })

describe('phrase de quittancement', () => {
    it('ne colle jamais deux mots entre eux', () => {
        // Le bug d'origine : « 680,00 euroscorrespondant au loyer ». JSX supprime
        // l'espace entre du texte et une expression `{}` séparés par un retour
        // à la ligne, ce qui soudait les mots à l'impression.
        const withoutCaf = declaration()
        const withCaf = declaration({ cafAmount: 250, paidByTenant: 430 })

        for (const text of [withoutCaf, withCaf]) {
            // Une minuscule suivie d'une majuscule au milieu d'un mot, ou un
            // chiffre suivi d'une lettre, trahissent une soudure.
            expect(text).not.toMatch(/[a-zéèêà][A-ZÉÈ]/)
            expect(text).not.toMatch(/\d[a-zA-Z]/)
            expect(text).not.toMatch(/€[a-zA-Z]/)
            expect(text).not.toMatch(/ {2}/)
        }
    })

    it('nomme le locataire en entier, avec élision', () => {
        expect(declaration()).toContain("reçu d'Alice Bernard")
        expect(declaration({ locataire: 'Marc Durand' })).toContain('reçu de Marc Durand')
    })

    it('mentionne le montant réglé et la période', () => {
        const text = declaration()

        expect(text).toContain('la somme de 680,00 €')
        expect(text).toContain('du 01/03/2026 au 31/03/2026')
        expect(text).toContain('sous réserve de tous mes droits')
    })

    it("détaille la part versée par la CAF quand il y en a une", () => {
        const text = declaration({ cafAmount: 250, paidByTenant: 430 })

        expect(text).toContain('la somme de 430,00 €')
        expect(text).toContain('complétée par 250,00 €')
        expect(text).toContain('allocation logement')
    })

    it('ne mentionne pas la CAF en son absence', () => {
        expect(declaration()).not.toContain('CAF')
    })
})
