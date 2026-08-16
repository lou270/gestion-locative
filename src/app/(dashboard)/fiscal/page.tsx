import Link from 'next/link'
import {
    AlertTriangle,
    Calculator,
    Download,
    Info,
    Receipt,
    TrendingDown,
    Wallet,
} from 'lucide-react'
import { getFiscalSummary } from '@/app/actions/fiscal'
import { DeleteExpenseButton } from '@/components/DeleteExpenseButton'
import { EditExpenseModal } from '@/components/EditExpenseModal'
import { ExpenseForm } from '@/components/ExpenseForm'
import { FiscalRegimeComparison } from '@/components/FiscalRegimeComparison'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { resolveYearParam } from '@/lib/dates'
import { expenseCategoryLabel } from '@/lib/expenses'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Repartition } from '@/lib/fiscal/lmnp'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Fiscalité LMNP · Gestion Locative' }

const TH = 'px-4 py-3'
const THEAD = 'bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500'

function TableRepartition({
    lignes,
    entete,
    vide,
}: {
    lignes: Repartition[]
    entete: string
    vide: string
}) {
    if (lignes.length === 0) {
        return <p className="px-4 py-6 text-center text-sm text-slate-500">{vide}</p>
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className={THEAD}>
                    <tr>
                        <th className={TH}>{entete}</th>
                        <th className={cn(TH, 'text-right')}>Nombre</th>
                        <th className={cn(TH, 'text-right')}>Montant</th>
                        <th className={cn(TH, 'text-right')}>Part</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                    {lignes.map((ligne) => (
                        <tr key={ligne.cle}>
                            <td className={cn(TH, 'font-medium text-slate-900')}>{ligne.libelle}</td>
                            <td className={cn(TH, 'text-right tabular-nums')}>{ligne.nombre}</td>
                            <td className={cn(TH, 'text-right tabular-nums')}>
                                {formatCurrency(ligne.montant)}
                            </td>
                            <td className={cn(TH, 'text-right tabular-nums')}>{ligne.part} %</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default async function FiscalPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string }>
}) {
    const { year: yearParam } = await searchParams
    const year = resolveYearParam(yearParam)
    const result = await getFiscalSummary(year)

    if (!result.success) {
        return (
            <>
                <PageHeader title="Fiscalité LMNP" />
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {result.error}
                </p>
            </>
        )
    }

    const { summary, availableYears, expenses, properties } = result.data
    const { microBic, reel, recommandation } = summary

    return (
        <>
            <PageHeader
                title="Fiscalité LMNP"
                description={`Résultat imposable ${year}, calculé sur les encaissements de l'année civile.`}
                action={
                    <a
                        href={`/api/fiscal/export?year=${year}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                        <Download size={16} />
                        Exporter en CSV
                    </a>
                }
            />

            <nav
                aria-label="Année fiscale"
                className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"
            >
                {availableYears.map((value) => (
                    <Link
                        key={value}
                        href={`/fiscal?year=${value}`}
                        aria-current={value === year ? 'page' : undefined}
                        className={cn(
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                            value === year
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-500 hover:text-slate-900',
                        )}
                    >
                        {value}
                    </Link>
                ))}
            </nav>

            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Info size={18} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p>
                        <span className="font-semibold">Outil d&apos;estimation.</span> Il ne
                        remplace pas un expert-comptable. Les amortissements ne sont pas calculés, et
                        le barème appliqué ({summary.regimeLabel}) doit être vérifié contre la loi de
                        finances et le formulaire 2042-C-PRO de l&apos;année.
                    </p>
                    {summary.alertes.map((alerte) => (
                        <p key={alerte} className="flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            {alerte}
                        </p>
                    ))}
                </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Recettes encaissées"
                    value={formatCurrency(summary.recettes.total)}
                    hint={`${summary.recettes.nombre} encaissement(s), dépôts de garantie exclus`}
                    icon={<Wallet size={18} />}
                    tone="indigo"
                />
                <StatCard
                    label="Charges déductibles"
                    value={formatCurrency(summary.charges.total)}
                    hint={`${summary.charges.nombre} charge(s) saisie(s)`}
                    icon={<Receipt size={18} />}
                    href="/fiscal#charges"
                />
                <StatCard
                    label="Résultat micro-BIC"
                    value={formatCurrency(microBic.resultat)}
                    hint={
                        microBic.eligible
                            ? `Après abattement de ${formatCurrency(microBic.abattement)}`
                            : 'Plafond dépassé : régime indisponible'
                    }
                    icon={<Calculator size={18} />}
                    tone={recommandation.regime === 'micro-bic' ? 'emerald' : 'neutral'}
                />
                <StatCard
                    label="Résultat au réel"
                    value={formatCurrency(reel.resultat)}
                    hint="Hors amortissements, non calculés"
                    icon={<TrendingDown size={18} />}
                    tone={recommandation.regime === 'reel' ? 'emerald' : 'neutral'}
                />
            </div>

            <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-900">
                    Comparaison des régimes
                </h2>
                <FiscalRegimeComparison summary={summary} />
            </section>

            <div className="mb-8 grid items-start gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader
                        title="Résultat par bien"
                        description="Les charges sans bien rattaché figurent en « Non affecté »."
                    />
                    <CardBody className="px-0 py-0">
                        {summary.parBien.length === 0 ? (
                            <p className="px-4 py-6 text-center text-sm text-slate-500">
                                Aucun mouvement sur {year}.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className={THEAD}>
                                        <tr>
                                            <th className={TH}>Bien</th>
                                            <th className={cn(TH, 'text-right')}>Recettes</th>
                                            <th className={cn(TH, 'text-right')}>Charges</th>
                                            <th className={cn(TH, 'text-right')}>Résultat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600">
                                        {summary.parBien.map((ligne) => (
                                            <tr key={ligne.propertyId ?? 'non-affecte'}>
                                                <td className={cn(TH, 'font-medium text-slate-900')}>
                                                    {ligne.libelle}
                                                </td>
                                                <td className={cn(TH, 'text-right tabular-nums')}>
                                                    {formatCurrency(ligne.recettes)}
                                                </td>
                                                <td className={cn(TH, 'text-right tabular-nums')}>
                                                    {formatCurrency(ligne.charges)}
                                                </td>
                                                <td
                                                    className={cn(
                                                        TH,
                                                        'text-right font-semibold tabular-nums',
                                                        ligne.resultat < 0
                                                            ? 'text-rose-600'
                                                            : 'text-slate-900',
                                                    )}
                                                >
                                                    {formatCurrency(ligne.resultat)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Recettes par nature" />
                        <CardBody className="px-0 py-0">
                            <TableRepartition
                                lignes={summary.recettes.parTypologie}
                                entete="Nature"
                                vide={`Aucun encaissement sur ${year}.`}
                            />
                            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                                Le dépôt de garantie est exclu : il n&apos;est imposable que s&apos;il
                                est conservé en fin de bail — cas que l&apos;application ne sait pas
                                encore exprimer.
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Charges par catégorie" />
                        <CardBody className="px-0 py-0">
                            <TableRepartition
                                lignes={summary.charges.parCategorie}
                                entete="Catégorie"
                                vide={`Aucune charge saisie sur ${year}.`}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <section id="charges" className="scroll-mt-8">
                <h2 className="mb-3 text-lg font-semibold tracking-tight text-slate-900">
                    Charges déductibles {year}
                </h2>

                <div className="grid items-start gap-6 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader
                            title={`Charges enregistrées (${expenses.length})`}
                            description="Rattachées à l'année par leur date de règlement."
                        />
                        <CardBody className="px-3 py-3">
                            {expenses.length === 0 ? (
                                <EmptyState
                                    icon={<Receipt size={20} />}
                                    title="Aucune charge saisie"
                                    description="Taxe foncière, assurance, travaux, intérêts d'emprunt… : saisissez-les pour comparer les deux régimes."
                                    className="border-0 bg-transparent"
                                />
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {expenses.map((expense) => (
                                        <li
                                            key={expense.id}
                                            className="flex items-center gap-3 px-3 py-3.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {expense.label}
                                                </p>
                                                <p className="mt-1 truncate text-sm text-slate-500">
                                                    {expenseCategoryLabel(expense.category)} ·{' '}
                                                    {expense.propertyName ?? 'Non affectée'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Réglée le {formatDate(expense.date)}
                                                    {expense.note ? ` · ${expense.note}` : ''}
                                                </p>
                                            </div>

                                            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                                                {formatCurrency(expense.amount)}
                                            </span>

                                            <div className="flex shrink-0 items-center gap-1">
                                                <EditExpenseModal
                                                    expense={expense}
                                                    properties={properties}
                                                />
                                                <DeleteExpenseButton
                                                    expenseId={expense.id}
                                                    label={expense.label}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader
                            title="Ajouter une charge"
                            description="Seules les charges effectivement décaissées sont déductibles."
                        />
                        <CardBody>
                            <ExpenseForm properties={properties} />
                        </CardBody>
                    </Card>
                </div>
            </section>
        </>
    )
}
