import {
    monthsBetween,
    parseDateInput,
    resolveMonthParam,
    resolveYearParam,
    toDateInputValue,
    yearRange,
} from './dates'

describe('parseDateInput', () => {
    it('conserve le jour saisi quel que soit le fuseau', () => {
        const date = parseDateInput('2026-01-15')

        expect(date?.getFullYear()).toBe(2026)
        expect(date?.getMonth()).toBe(0)
        // `new Date("2026-01-15")` renvoie le 14 dans les fuseaux négatifs.
        expect(date?.getDate()).toBe(15)
    })

    it('rejette une saisie vide ou incohérente', () => {
        expect(parseDateInput('')).toBeNull()
        expect(parseDateInput('pas une date')).toBeNull()
        expect(parseDateInput(undefined)).toBeNull()
    })
})

describe('toDateInputValue', () => {
    it('fait l’aller-retour sans décalage', () => {
        expect(toDateInputValue(parseDateInput('2026-03-01'))).toBe('2026-03-01')
    })

    it('renvoie une chaîne vide pour une valeur absente', () => {
        expect(toDateInputValue(null)).toBe('')
    })
})

describe('resolveMonthParam', () => {
    it('résout des paramètres valides', () => {
        const date = resolveMonthParam('2', '2026')

        expect(date.getMonth()).toBe(1)
        expect(date.getFullYear()).toBe(2026)
    })

    it('retombe sur le mois courant si les paramètres sont aberrants', () => {
        const fallback = new Date(2026, 6, 20, 12)

        expect(resolveMonthParam('13', '2026', fallback).getMonth()).toBe(6)
        expect(resolveMonthParam(null, null, fallback).getMonth()).toBe(6)
        expect(resolveMonthParam('abc', '1899', fallback).getMonth()).toBe(6)
    })
})

describe('monthsBetween', () => {
    it('compte les mois bornes incluses', () => {
        expect(monthsBetween(new Date(2026, 0, 1), new Date(2026, 2, 31))).toBe(3)
    })

    it('renvoie 0 si la fin précède le début', () => {
        expect(monthsBetween(new Date(2026, 5, 1), new Date(2026, 0, 1))).toBe(0)
    })
})

describe('resolveYearParam', () => {
    const fallback = new Date(2026, 6, 20, 12)

    it('résout une année valide', () => {
        expect(resolveYearParam('2025', fallback)).toBe(2025)
    })

    it("retombe sur l'année courante si le paramètre est absent ou aberrant", () => {
        expect(resolveYearParam(null, fallback)).toBe(2026)
        expect(resolveYearParam(undefined, fallback)).toBe(2026)
        expect(resolveYearParam('', fallback)).toBe(2026)
        expect(resolveYearParam('abc', fallback)).toBe(2026)
        expect(resolveYearParam('1899', fallback)).toBe(2026)
        expect(resolveYearParam('2200', fallback)).toBe(2026)
        expect(resolveYearParam('2025.5', fallback)).toBe(2026)
    })
})

describe('yearRange', () => {
    it("couvre l'année entière, borne haute exclusive", () => {
        const { gte, lt } = yearRange(2026)

        // Le 31 décembre à 23 h 59 doit rester dans l'année : `lte: 31/12 à
        // minuit` l'excluait.
        expect(new Date(2026, 11, 31, 23, 59) >= gte).toBe(true)
        expect(new Date(2026, 11, 31, 23, 59) < lt).toBe(true)

        expect(new Date(2025, 11, 31, 23, 59) >= gte).toBe(false)
        expect(new Date(2027, 0, 1, 0, 0) < lt).toBe(false)
    })
})
