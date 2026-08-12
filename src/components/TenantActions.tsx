'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarX, ChevronDown, FileDown, FileUp, Settings2 } from 'lucide-react'
import { SignButton } from '@/components/SignButton'
import { CafAttestationModal } from '@/components/CafAttestationModal'
import { TerminateLeaseModal } from '@/components/TerminateLeaseModal'

type PrefillResult = { success: true; data: Record<string, string> } | { success: false; error: string }

/**
 * Actions sur le bail : menu déroulant et boîtes de dialogue associées.
 *
 * Les modales sont rendues **en dehors** du panneau déroulant. Imbriquées, elles
 * étaient démontées dès la fermeture du menu — et disparaissaient donc au
 * moment même où l'utilisateur les ouvrait.
 */
export function TenantActions({
    tenantId,
    tenantName,
    endDate,
    loadCafPrefill,
}: {
    tenantId: string
    tenantName: string
    endDate: string | null
    loadCafPrefill: () => Promise<PrefillResult>
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [cafOpen, setCafOpen] = useState(false)
    const [terminateOpen, setTerminateOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return

        const onPointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [menuOpen])

    const itemClass =
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100'

    return (
        <>
            <div className="relative inline-block text-left" ref={containerRef}>
                <button
                    type="button"
                    onClick={() => setMenuOpen((value) => !value)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    <Settings2 size={15} className="text-slate-400" />
                    Gestion du bail
                    <ChevronDown
                        size={15}
                        className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {menuOpen && (
                    <div
                        role="menu"
                        className="absolute left-0 z-40 mt-2 w-64 origin-top-left rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/5"
                    >
                        <a
                            href={`/api/lease/${tenantId}`}
                            target="_blank"
                            rel="noopener"
                            className={itemClass}
                            onClick={() => setMenuOpen(false)}
                        >
                            <FileDown size={16} className="text-slate-400" />
                            Télécharger le bail
                        </a>

                        <button
                            type="button"
                            className={itemClass}
                            onClick={() => {
                                setMenuOpen(false)
                                setCafOpen(true)
                            }}
                        >
                            <FileUp size={16} className="text-slate-400" />
                            Attestation de loyer CAF
                        </button>

                        <SignButton tenantId={tenantId} />

                        <div className="my-1 border-t border-slate-100" />

                        <button
                            type="button"
                            className={itemClass}
                            onClick={() => {
                                setMenuOpen(false)
                                setTerminateOpen(true)
                            }}
                        >
                            <CalendarX size={16} className="text-slate-400" />
                            {endDate ? 'Modifier la fin de bail' : 'Clôturer le bail'}
                        </button>
                    </div>
                )}
            </div>

            <CafAttestationModal
                open={cafOpen}
                onClose={() => setCafOpen(false)}
                tenantId={tenantId}
                tenantName={tenantName}
                loadPrefill={loadCafPrefill}
            />

            <TerminateLeaseModal
                open={terminateOpen}
                onClose={() => setTerminateOpen(false)}
                tenantId={tenantId}
                existingEndDate={endDate}
            />
        </>
    )
}
