import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Modal } from './Modal'

/**
 * Reproduit la configuration réelle : un champ contrôlé dans une modale dont
 * le parent se rend à nouveau à chaque frappe, en passant une fonction
 * fléchée à `onClose`.
 */
function Harness() {
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(true)

    return (
        <Modal open={open} onClose={() => setOpen(false)} title="Attestation">
            <input
                aria-label="champ"
                value={value}
                onChange={(event) => setValue(event.target.value)}
            />
        </Modal>
    )
}

describe('Modal', () => {
    afterEach(() => {
        document.body.style.overflow = ''
    })

    it('conserve le focus du champ pendant la saisie', () => {
        render(<Harness />)
        const input = screen.getByLabelText('champ')
        input.focus()

        // Chaque frappe re-rend le parent avec un nouveau `onClose` : l'effet
        // de la modale se relançait et son `focus()` volait le curseur.
        fireEvent.change(input, { target: { value: 'S' } })
        expect(document.activeElement).toBe(input)

        fireEvent.change(input, { target: { value: 'SC' } })
        fireEvent.change(input, { target: { value: 'SCI' } })

        expect(document.activeElement).toBe(input)
        expect(input).toHaveValue('SCI')
    })

    it('donne le focus au panneau à l’ouverture', () => {
        render(
            <Modal open onClose={() => {}} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )

        expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })

    it('ferme sur la touche Échap', () => {
        const onClose = jest.fn()
        render(
            <Modal open onClose={onClose} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('utilise toujours le dernier `onClose` reçu', () => {
        const first = jest.fn()
        const second = jest.fn()

        const { rerender } = render(
            <Modal open onClose={first} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )
        rerender(
            <Modal open onClose={second} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it('rend le défilement de la page à la fermeture', () => {
        const { rerender } = render(
            <Modal open onClose={() => {}} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )
        expect(document.body.style.overflow).toBe('hidden')

        rerender(
            <Modal open={false} onClose={() => {}} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )

        expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('n’affiche rien quand elle est fermée', () => {
        render(
            <Modal open={false} onClose={() => {}} title="Attestation">
                <p>Contenu</p>
            </Modal>,
        )

        expect(screen.queryByRole('dialog')).toBeNull()
    })
})
