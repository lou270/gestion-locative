import { buildFiscalCsvRows, FISCAL_CSV_HEADERS } from './csv'
import type { FiscalExpense, FiscalPayment } from './lmnp'

const payment = (overrides: Partial<FiscalPayment> = {}): FiscalPayment => ({
    amount: 650,
    date: new Date(2025, 0, 5, 12),
    typology: 'Loyer',
    periodStart: new Date(2025, 0, 1, 12),
    periodEnd: new Date(2025, 0, 31, 12),
    tenantId: 'tenant-1',
    tenantName: 'Dupont Marie',
    propertyId: 'prop-1',
    propertyName: 'Appartement Centre',
    ...overrides,
})

const expense = (overrides: Partial<FiscalExpense> = {}): FiscalExpense => ({
    id: 'exp-1',
    amount: 900,
    date: new Date(2025, 9, 15, 12),
    category: 'TaxeFonciere',
    label: 'Taxe foncière 2025',
    note: null,
    propertyId: 'prop-1',
    propertyName: 'Appartement Centre',
    ...overrides,
})

describe('buildFiscalCsvRows', () => {
    it('produit une ligne par mouvement, au format des en-têtes', () => {
        const rows = buildFiscalCsvRows({ payments: [payment()], expenses: [expense()] })

        expect(rows).toHaveLength(2)
        for (const row of rows) {
            expect(row).toHaveLength(FISCAL_CSV_HEADERS.length)
        }
    })

    it('exclut le dépôt de garantie, comme le calcul', () => {
        const rows = buildFiscalCsvRows({
            payments: [payment(), payment({ amount: 1300, typology: 'Depot' })],
            expenses: [],
        })

        expect(rows).toHaveLength(1)
    })

    it('signe les charges négativement', () => {
        const rows = buildFiscalCsvRows({ payments: [], expenses: [expense()] })

        // La somme de la colonne Montant redonne ainsi le résultat au réel.
        expect(rows[0][0]).toBe('Charge')
        expect(rows[0][7]).toBe('-900,00')
    })

    it('trie les mouvements par date, recettes et charges mêlées', () => {
        const rows = buildFiscalCsvRows({
            payments: [payment({ date: new Date(2025, 11, 3, 12) })],
            expenses: [expense({ date: new Date(2025, 2, 10, 12) })],
        })

        expect(rows.map((row) => row[1])).toEqual(['10/03/2025', '03/12/2025'])
    })

    it("renseigne le locataire et la période d'une recette", () => {
        const rows = buildFiscalCsvRows({ payments: [payment()], expenses: [] })

        expect(rows[0][0]).toBe('Recette')
        expect(rows[0][5]).toBe('Dupont Marie')
        expect(rows[0][6]).toBe('01/01/2025 - 31/01/2025')
        expect(rows[0][7]).toBe('650,00')
    })

    it('laisse le bien vide quand la charge n’est rattachée à aucun bien', () => {
        const rows = buildFiscalCsvRows({
            payments: [],
            expenses: [expense({ propertyId: null, propertyName: null, note: 'Payée en ligne' })],
        })

        expect(rows[0][4]).toBe('')
        expect(rows[0][8]).toBe('Payée en ligne')
    })
})
