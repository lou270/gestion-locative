import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/format'
import type { FiscalSummary } from '@/lib/fiscal/lmnp'
import { cn } from '@/lib/cn'

function Ligne({
    label,
    value,
    tone = 'neutral',
}: {
    label: string
    value: string
    tone?: 'neutral' | 'total'
}) {
    return (
        <div
            className={cn(
                'flex items-baseline justify-between gap-4 py-2',
                tone === 'total' && 'border-t border-slate-200 pt-3 font-semibold text-slate-900',
            )}
        >
            <span className={cn('text-sm', tone === 'neutral' && 'text-slate-600')}>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    )
}

function Colonne({
    titre,
    sousTitre,
    retenu,
    children,
}: {
    titre: string
    sousTitre: string
    retenu: boolean
    children: React.ReactNode
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border p-5',
                retenu
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-sm shadow-emerald-200/40'
                    : 'border-slate-200/70 bg-white',
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-slate-900">{titre}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{sousTitre}</p>
                </div>
                {retenu && <Badge tone="success">Retenu</Badge>}
            </div>
            {children}
        </div>
    )
}

/** Les deux régimes côte à côte, le détail du calcul et les cases à reporter. */
export function FiscalRegimeComparison({ summary }: { summary: FiscalSummary }) {
    const { microBic, reel, recommandation, cases } = summary
    const caseReel = reel.deficit ? cases.reelDeficit : cases.reelBenefice
    const retenu = (regime: typeof recommandation.regime) =>
        recommandation.comparable && recommandation.regime === regime

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Colonne
                    titre="Micro-BIC"
                    sousTitre={`Abattement forfaitaire de ${Math.round(microBic.tauxAbattement * 100)} %`}
                    retenu={retenu('micro-bic')}
                >
                    <Ligne label="Recettes encaissées" value={formatCurrency(microBic.recettes)} />
                    <Ligne
                        label={
                            microBic.abattementPlancherApplique
                                ? 'Abattement (plancher légal)'
                                : 'Abattement forfaitaire'
                        }
                        value={`− ${formatCurrency(microBic.abattement)}`}
                    />
                    <Ligne
                        label="Résultat imposable"
                        value={formatCurrency(microBic.resultat)}
                        tone="total"
                    />

                    {microBic.plafondDepasse ? (
                        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            Recettes supérieures au plafond de{' '}
                            {formatCurrency(microBic.plafond)} : ce régime n&apos;est pas
                            applicable.
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-slate-500">
                            À reporter en case <span className="font-semibold">{cases.microBic}</span>{' '}
                            de la 2042-C-PRO.
                        </p>
                    )}
                </Colonne>

                <Colonne
                    titre="Régime réel"
                    sousTitre="Recettes moins charges déductibles"
                    retenu={retenu('reel')}
                >
                    <Ligne label="Recettes encaissées" value={formatCurrency(reel.recettes)} />
                    <Ligne label="Charges saisies" value={`− ${formatCurrency(reel.charges)}`} />
                    <Ligne
                        label={reel.deficit ? 'Déficit' : 'Résultat imposable'}
                        value={formatCurrency(reel.resultat)}
                        tone="total"
                    />

                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Les amortissements ne sont pas calculés : le résultat réel est en pratique
                        inférieur à ce montant. Case <span className="font-semibold">{caseReel}</span>{' '}
                        de la 2042-C-PRO.
                    </p>
                </Colonne>
            </div>

            <div
                className={cn(
                    'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
                    !recommandation.comparable
                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                        : recommandation.certaine
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900',
                )}
            >
                {!recommandation.comparable ? (
                    <Info size={18} className="mt-0.5 shrink-0" />
                ) : recommandation.certaine ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                ) : (
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                )}
                <p>{recommandation.message}</p>
            </div>
        </div>
    )
}
