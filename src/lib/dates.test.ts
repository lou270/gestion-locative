import { monthsBetween, parseDateInput, resolveMonthParam, toDateInputValue } from './dates'

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
