/**
 * @jest-environment node
 */

import { csvResponse } from './csv-response'

describe('csvResponse', () => {
    it('préfixe le corps du BOM UTF-8', async () => {
        const response = csvResponse('Type;Montant', 'export-fiscal-lmnp-2026')

        // Le décodeur UTF-8 de `text()` avale le BOM : on inspecte donc les
        // octets bruts, seuls à prouver qu'Excel le recevra.
        const bytes = new Uint8Array(await response.arrayBuffer())

        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    })

    it('renvoie les en-têtes de téléchargement attendus', () => {
        const response = csvResponse('', 'export fiscal LMNP 2026')

        expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
        expect(response.headers.get('Content-Disposition')).toBe(
            'attachment; filename="export-fiscal-LMNP-2026.csv"',
        )
        expect(response.headers.get('Cache-Control')).toBe('no-store')
    })
})
