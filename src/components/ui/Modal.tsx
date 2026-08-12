'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Boîte de dialogue accessible : fermeture par Échap, clic sur le fond,
 * focus déplacé dans la modale et défilement de la page bloqué.
 */
export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    className,
}: {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}) {
    const panelRef = useRef<HTMLDivElement>(null)

    /**
     * `onClose` est presque toujours une fonction fléchée recréée à chaque
     * rendu. La garder dans les dépendances de l'effet relançait celui-ci à
     * chaque frappe : le `focus()` sur le panneau volait alors le curseur du
     * champ en cours de saisie. Le ref le rend insensible à cette identité.
     */
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    })

    // Ne dépend que de `open` : le focus n'est posé qu'à l'ouverture.
    useEffect(() => {
        if (!open) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseRef.current()
        }

        document.addEventListener('keydown', onKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        panelRef.current?.focus()

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    'my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl outline-none',
                    className,
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
