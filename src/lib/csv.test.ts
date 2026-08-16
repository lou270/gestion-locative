import { escapeCsvField, formatCsvAmount, toCsv } from './csv'

describe('escapeCsvField', () => {
    it('laisse un champ simple intact', () => {
        expect(escapeCsvField('Taxe fonciere')).toBe('Taxe fonciere')
    })

    it('encadre de guillemets un champ contenant le séparateur', () => {
        expect(escapeCsvField('Travaux ; peinture')).toBe('"Travaux ; peinture"')
    })

    it('double les guillemets internes', () => {
        expect(escapeCsvField('Facture "Durand"')).toBe('"Facture ""Durand"""')
    })

    it('encadre un champ contenant un saut de ligne', () => {
        expect(escapeCsvField('ligne 1\nligne 2')).toBe('"ligne 1\nligne 2"')
    })

    it('rend vide une valeur absente', () => {
        expect(escapeCsvField(null)).toBe('')
        expect(escapeCsvField(undefined)).toBe('')
    })

    it("neutralise l'injection de formule dans un champ texte", () => {
        expect(escapeCsvField('=1+1')).toBe("'=1+1")
        expect(escapeCsvField('@SUM(A1)')).toBe("'@SUM(A1)")
        expect(escapeCsvField('-- remise')).toBe("'-- remise")
    })

    it('laisse un montant négatif intact', () => {
        // Le préfixer d'une apostrophe le transformerait en texte et casserait
        // la somme de la colonne.
        expect(escapeCsvField('-1240,00')).toBe('-1240,00')
        expect(escapeCsvField(-1240)).toBe('-1240')
    })
})

describe('formatCsvAmount', () => {
    it('utilise la virgule décimale et deux décimales', () => {
        expect(formatCsvAmount(1234.5)).toBe('1234,50')
        expect(formatCsvAmount(-1240)).toBe('-1240,00')
    })

    it('retombe sur zéro pour une valeur non finie', () => {
        expect(formatCsvAmount(NaN)).toBe('0,00')
    })
})

describe('toCsv', () => {
    it('joint les colonnes par un point-virgule et les lignes en CRLF', () => {
        expect(
            toCsv([
                ['a', 'b'],
                ['c', 'd'],
            ]),
        ).toBe('a;b\r\nc;d')
    })
})
