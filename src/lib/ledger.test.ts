import {
    buildPaymentHistory,
    canIssueReceipt,
    getCarriedBalance,
    getMonthLedger,
    getTenantBalance,
    splitRentAndCharge,
} from './ledger'

const TENANT = {
    rentAmount: 600,
    chargeAmount: 50,
    startDate: new Date(2026, 0, 1, 12),
    endDate: null,
}

const payment = (
    year: number,
    month: number,
    amount: number,
    typology = 'Loyer',
    id = `${year}-${month}-${typology}`,
) => ({
    id,
    amount,
    date: new Date(year, month - 1, 5, 12),
    periodStart: new Date(year, month - 1, 1, 12),
    typology,
})

describe('splitRentAndCharge', () => {
    it('répartit au prorata du bail', () => {
        expect(splitRentAndCharge(650, 600, 50)).toEqual({ rent: 600, charge: 50 })
    })

    it('conserve le total malgré les arrondis', () => {
        const { rent, charge } = splitRentAndCharge(333.33, 600, 50)
        expect(rent + charge).toBeCloseTo(333.33, 2)
    })

    it('ne produit pas de NaN quand loyer et charges sont nuls', () => {
        expect(splitRentAndCharge(400, 0, 0)).toEqual({ rent: 400, charge: 0 })
    })
})

describe('getTenantBalance', () => {
    it("exclut le dépôt de garantie du solde de loyer", () => {
        const payments = [
            payment(2026, 1, 650),
            payment(2026, 1, 650, 'Depot', 'depot-1'),
        ]

        const balance = getTenantBalance(TENANT, payments, new Date(2026, 0, 31, 12))

        expect(balance.totalDue).toBe(650)
        expect(balance.totalPaid).toBe(650)
        expect(balance.deposit).toBe(650)
        // Sans cette règle, le dépôt faisait apparaître une avance de 650 €.
        expect(balance.balance).toBe(0)
    })

    it("compte l'allocation CAF comme un règlement du loyer", () => {
        const payments = [payment(2026, 1, 400), payment(2026, 1, 250, 'CAF', 'caf-1')]

        const balance = getTenantBalance(TENANT, payments, new Date(2026, 0, 31, 12))

        expect(balance.balance).toBe(0)
    })

    it('arrête de compter les loyers après la fin du bail', () => {
        const ended = { ...TENANT, endDate: new Date(2026, 1, 28, 12) }

        const balance = getTenantBalance(ended, [], new Date(2026, 5, 30, 12))

        expect(balance.totalDue).toBe(1300) // janvier + février uniquement
    })
})

describe('getMonthLedger', () => {
    it('marque un mois soldé comme réglé', () => {
        const ledger = getMonthLedger(TENANT, [payment(2026, 3, 650)], new Date(2026, 2, 1, 12))

        expect(ledger?.status).toBe('Paid')
        expect(ledger?.remaining).toBe(0)
    })

    it('marque un règlement incomplet comme partiel', () => {
        const ledger = getMonthLedger(TENANT, [payment(2026, 3, 300)], new Date(2026, 2, 1, 12))

        expect(ledger?.status).toBe('Partial')
        expect(ledger?.remaining).toBe(350)
    })

    it('ignore le dépôt de garantie imputé au mois', () => {
        const ledger = getMonthLedger(
            TENANT,
            [payment(2026, 1, 650, 'Depot', 'depot-1')],
            new Date(2026, 0, 1, 12),
        )

        expect(ledger?.status).toBe('Unpaid')
        expect(ledger?.totalPaid).toBe(0)
    })

    it('retourne null hors période du bail', () => {
        expect(getMonthLedger(TENANT, [], new Date(2025, 10, 1, 12))).toBeNull()
    })
})

describe('getCarriedBalance', () => {
    it('reporte les arriérés des mois précédents', () => {
        // Janvier et février dus, seul janvier réglé.
        const balance = getCarriedBalance(TENANT, [payment(2026, 1, 650)], new Date(2026, 2, 1, 12))

        expect(balance).toBe(-650)
    })

    it('ignore les règlements imputés au mois courant ou à venir', () => {
        const payments = [payment(2026, 1, 650), payment(2026, 3, 650)]

        // Le paiement de mars ne doit pas effacer l'arriéré de février.
        expect(getCarriedBalance(TENANT, payments, new Date(2026, 2, 1, 12))).toBe(-650)
    })

    it('vaut zéro pour le premier mois du bail', () => {
        expect(getCarriedBalance(TENANT, [], new Date(2026, 0, 1, 12))).toBe(0)
    })
})

describe('canIssueReceipt', () => {
    it('autorise la quittance quand tout est réglé', () => {
        const payments = [payment(2026, 1, 650), payment(2026, 2, 650)]

        expect(canIssueReceipt(TENANT, payments, new Date(2026, 1, 1, 12)).ok).toBe(true)
    })

    it('bloque la quittance en cas d’arriéré antérieur', () => {
        const payments = [payment(2026, 2, 650)]

        expect(canIssueReceipt(TENANT, payments, new Date(2026, 1, 1, 12)).ok).toBe(false)
    })

    it("ne compte pas le dépôt de garantie comme un loyer réglé", () => {
        const payments = [payment(2026, 1, 650, 'Depot', 'depot-1')]

        expect(canIssueReceipt(TENANT, payments, new Date(2026, 0, 1, 12)).ok).toBe(false)
    })
})

describe('buildPaymentHistory', () => {
    it("couvre l'entrée jusqu'au mois suivant, du plus récent au plus ancien", () => {
        const history = buildPaymentHistory(TENANT, [], { now: new Date(2026, 2, 15, 12) })

        expect(history).toHaveLength(4) // janvier → avril
        expect(history[0].date.getMonth()).toBe(3)
        expect(history[history.length - 1].date.getMonth()).toBe(0)
    })

    it('omet les mois postérieurs à la fin du bail', () => {
        const ended = { ...TENANT, endDate: new Date(2026, 1, 15, 12) }

        const history = buildPaymentHistory(ended, [], { now: new Date(2026, 4, 1, 12) })

        expect(history.map((month) => month.date.getMonth())).toEqual([1, 0])
    })
})
