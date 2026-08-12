import Link from 'next/link'
import { AlertTriangle, ArrowRight, Building2, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { getFinancialStats } from '@/app/actions/finance'
import { getTenantsOverview } from '@/app/actions/tenant'
import { RevenueChart } from '@/components/RevenueChart'
import { TenantCard } from '@/components/TenantCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, initials } from '@/lib/format'

const MAX_TENANTS_SHOWN = 6

export default async function DashboardPage() {
    const [statsResult, tenantsResult] = await Promise.all([
        getFinancialStats(),
        getTenantsOverview(),
    ])

    const stats = statsResult.success ? statsResult.data : null
    const tenants = tenantsResult.success ? tenantsResult.data : []
    const activeTenants = tenants.filter((tenant) => tenant.active)
    const currentYear = new Date().getFullYear()

    return (
        <>
            <PageHeader
                title="Tableau de bord"
                description={`Situation de votre parc locatif au ${new Date().toLocaleDateString('fr-FR')}.`}
                action={<ButtonLink href="/tenants/new">Nouveau locataire</ButtonLink>}
            />

            {!statsResult.success && (
                <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {statsResult.error}
                </p>
            )}

            {stats && (
                <>
                    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label={`Encaissé en ${currentYear}`}
                            value={formatCurrency(stats.totalYearly)}
                            hint="Dépôts de garantie exclus"
                            icon={<TrendingUp size={17} />}
                            tone="indigo"
                        />
                        <StatCard
                            label="Loyers attendus / mois"
                            value={formatCurrency(stats.monthlyRentRoll)}
                            hint={`${stats.activeTenantsCount} bail(s) en cours`}
                            icon={<Wallet size={17} />}
                            tone="neutral"
                        />
                        <StatCard
                            label="Taux d'occupation"
                            value={`${stats.occupancyRate} %`}
                            hint={`${stats.rentedPropertiesCount} bien(s) loué(s) sur ${stats.totalProperties}`}
                            icon={<Building2 size={17} />}
                            tone="emerald"
                            href="/properties"
                        />
                        <StatCard
                            label="Impayés"
                            value={formatCurrency(stats.totalOverdue)}
                            hint={
                                stats.overdueTenants.length > 0
                                    ? `${stats.overdueTenants.length} locataire(s) en retard`
                                    : 'Tous les loyers sont à jour'
                            }
                            icon={
                                stats.overdueTenants.length > 0 ? (
                                    <AlertTriangle size={17} />
                                ) : (
                                    <PiggyBank size={17} />
                                )
                            }
                            tone={stats.overdueTenants.length > 0 ? 'rose' : 'emerald'}
                        />
                    </section>

                    <div className="mt-8 grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader
                                title={`Revenus ${currentYear}`}
                                description="Encaissements de loyers, mois par mois."
                            />
                            <CardBody>
                                <RevenueChart data={stats.chartData} />
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader
                                title="À relancer"
                                description="Locataires au solde débiteur."
                            />
                            <CardBody className="px-3 py-3">
                                {stats.overdueTenants.length === 0 ? (
                                    <p className="px-3 py-8 text-center text-sm text-slate-500">
                                        Aucun impayé. Tout est à jour.
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {stats.overdueTenants.slice(0, 6).map((tenant) => (
                                            <li key={tenant.id}>
                                                <Link
                                                    href={`/tenants/${tenant.id}`}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">
                                                        {initials(
                                                            tenant.firstName,
                                                            tenant.lastName,
                                                        )}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium text-slate-800">
                                                            {tenant.firstName} {tenant.lastName}
                                                        </span>
                                                        <span className="block truncate text-xs text-slate-500">
                                                            {tenant.propertyName ?? 'Sans bien lié'}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-sm font-semibold text-rose-600">
                                                        {formatCurrency(tenant.balance)}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </>
            )}

            <section className="mt-10">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900">Baux en cours</h2>
                    {activeTenants.length > MAX_TENANTS_SHOWN && (
                        <Link
                            href="/tenants"
                            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            Voir les {activeTenants.length} locataires
                            <ArrowRight size={15} />
                        </Link>
                    )}
                </div>

                {activeTenants.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {activeTenants.slice(0, MAX_TENANTS_SHOWN).map((tenant) => (
                            <TenantCard key={tenant.id} tenant={tenant} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Building2 size={20} />}
                        title="Aucun bail en cours"
                        description="Ajoutez un bien puis un locataire pour commencer le suivi des loyers."
                        action={<ButtonLink href="/tenants/new">Ajouter un locataire</ButtonLink>}
                    />
                )}
            </section>
        </>
    )
}
