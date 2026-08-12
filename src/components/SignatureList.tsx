'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Download, RotateCw, XCircle } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/format'

interface SignatureRequest {
    id: string
    status: string
    createdAt: string | Date
}

const STATUS_VIEW: Record<string, { label: string; tone: BadgeTone; icon: React.ReactNode }> = {
    SIGNED: { label: 'Signé', tone: 'success', icon: <CheckCircle2 size={12} /> },
    REJECTED: { label: 'Refusé', tone: 'danger', icon: <XCircle size={12} /> },
    EXPIRED: { label: 'Expiré', tone: 'neutral', icon: <XCircle size={12} /> },
    PENDING: { label: 'En attente', tone: 'warning', icon: <Clock size={12} /> },
}

export function SignatureList({ signatureRequests }: { signatureRequests: SignatureRequest[] }) {
    const router = useRouter()
    const toast = useToast()
    const [pending, startTransition] = useTransition()

    if (!signatureRequests?.length) {
        return <p className="text-sm text-slate-500">Aucune demande de signature.</p>
    }

    const checkStatus = (id: string) => {
        startTransition(async () => {
            try {
                const response = await fetch(`/api/signatures/${id}`)
                const body = await response.json().catch(() => null)
                if (!response.ok) {
                    toast.error(body?.error ?? 'Vérification impossible.')
                    return
                }
                toast.success(`Statut : ${STATUS_VIEW[body.status]?.label ?? body.status}`)
                router.refresh()
            } catch {
                toast.error('Erreur réseau.')
            }
        })
    }

    return (
        <ul className="space-y-2">
            {signatureRequests.map((request) => {
                const view = STATUS_VIEW[request.status] ?? STATUS_VIEW.PENDING
                return (
                    <li
                        key={request.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">Bail de location</p>
                            <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                            <Badge tone={view.tone}>
                                {view.icon}
                                {view.label}
                            </Badge>

                            {request.status === 'PENDING' && (
                                <button
                                    type="button"
                                    onClick={() => checkStatus(request.id)}
                                    disabled={pending}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                    title="Actualiser le statut"
                                    aria-label="Actualiser le statut"
                                >
                                    <RotateCw size={14} className={pending ? 'animate-spin' : ''} />
                                </button>
                            )}

                            {request.status === 'SIGNED' && (
                                <a
                                    href={`/api/signatures/${request.id}/download`}
                                    target="_blank"
                                    rel="noopener"
                                    className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                                    title="Télécharger le bail signé"
                                    aria-label="Télécharger le bail signé"
                                >
                                    <Download size={14} />
                                </a>
                            )}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
