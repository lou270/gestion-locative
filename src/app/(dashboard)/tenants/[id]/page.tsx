import { notFound } from 'next/navigation'
import { Building2, FileDown, Mail, MapPin, Phone, ReceiptText } from 'lucide-react'
import { getTenant } from '@/app/actions/tenant'
import { getProperties } from '@/app/actions/property'
import { PaymentForm } from '@/components/PaymentForm'
import { DeletePaymentButton } from '@/components/DeletePaymentButton'
import { SignatureList } from '@/components/SignatureList'
import { TenantActions } from '@/components/TenantActions'
import { EditTenantModal } from '@/components/EditTenantModal'
import { RentRevisionButton } from '@/components/RentRevisionButton'
import { getCafPrefill } from '@/app/actions/caf'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { buildPaymentHistory, getTenantBalance, PAYMENT_TYPE_LABELS } from '@/lib/ledger'
import { formatCurrency, formatDate, formatMonthYear, initials } from '@/lib/format'
import { cn } from '@/lib/cn'

const STATUS_VIEW: Record<string, { label: string; tone: BadgeTone; dot: string }> = {
    Paid: { label: 'Réglé', tone: 'success', dot: 'bg-emerald-500' },
    Partial: { label: 'Partiel', tone: 'warning', dot: 'bg-amber-500' },
    Unpaid: { label: 'Impayé', tone: 'danger', dot: 'bg-rose-500' },
}

export default async function TenantPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const result = await getTenant(id)

    if (!result.success || !result.data) notFound()

    const tenant = result.data
    const propertiesResult = await getProperties()
    const properties = propertiesResult.success ? propertiesResult.data : []

    const { totalDue, totalPaid, deposit, balance } = getTenantBalance(tenant, tenant.payments)
    const history = buildPaymentHistory(tenant, tenant.payments)
    const active = !tenant.endDate || new Date(tenant.endDate) >= new Date()

    return (
        <>
            <PageHeader
                title={`${tenant.firstName} ${tenant.lastName}`}
                breadcrumbs={[
                    { label: 'Locataires', href: '/tenants' },
                    { label: `${tenant.firstName} ${tenant.lastName}` },
                ]}
            />

            {/* En-tête du dossier */}
            <Card className="mb-6">
                <CardBody className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-xl font-bold text-indigo-700">
                            {initials(tenant.firstName, tenant.lastName)}
                        </span>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {tenant.firstName} {tenant.lastName}
                                </h2>
                                <Badge tone={active ? 'success' : 'neutral'}>
                                    {active ? 'Bail en cours' : 'Bail terminé'}
                                </Badge>
                                <EditTenantModal tenant={tenant} properties={properties} />
                            </div>

                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    {tenant.property ? (
                                        <Building2 size={14} />
                                    ) : (
                                        <MapPin size={14} />
                                    )}
                                    {tenant.property?.name ?? `${tenant.address}, ${tenant.city}`}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>Entrée le {formatDate(tenant.startDate)}</span>
                                {tenant.endDate && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-rose-600">
                                            Sortie le {formatDate(tenant.endDate)}
                                        </span>
                                    </>
                                )}
                            </p>

                            <div className="mt-3">
                                <TenantActions
                                    tenantId={tenant.id}
                                    tenantName={`${tenant.firstName} ${tenant.lastName}`}
                                    endDate={
                                        tenant.endDate
                                            ? new Date(tenant.endDate).toISOString()
                                            : null
                                    }
                                    loadCafPrefill={getCafPrefill.bind(null, tenant.id)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Synthèse financière */}
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-4">
                        <div>
                            <dt className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Loyer
                                <RentRevisionButton
                                    tenantId={tenant.id}
                                    currentRent={tenant.rentAmount}
                                />
                            </dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {formatCurrency(tenant.rentAmount)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Charges
                            </dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {formatCurrency(tenant.chargeAmount)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Dépôt de garantie
                            </dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {deposit > 0 ? formatCurrency(deposit) : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Solde à ce jour
                            </dt>
                            <dd
                                className={cn(
                                    'mt-1 text-lg font-bold',
                                    balance < -0.01
                                        ? 'text-rose-600'
                                        : balance > 0.01
                                          ? 'text-emerald-600'
                                          : 'text-slate-900',
                                )}
                            >
                                {balance > 0 ? '+' : ''}
                                {formatCurrency(balance)}
                            </dd>
                        </div>
                    </dl>
                </CardBody>
            </Card>

            <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Échéancier */}
                    <Card>
                        <CardHeader
                            title="Échéancier"
                            description={`Cumul dû ${formatCurrency(totalDue)} · réglé ${formatCurrency(totalPaid)}`}
                            action={<Badge tone="info">{history.length} mois</Badge>}
                        />
                        <ul className="divide-y divide-slate-100">
                            {history.map((month) => {
                                const view = STATUS_VIEW[month.status]
                                return (
                                    <li
                                        key={month.date.toISOString()}
                                        className="group flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="flex gap-3">
                                            <span
                                                className={cn(
                                                    'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                                                    view.dot,
                                                )}
                                                aria-hidden
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900">
                                                    {formatMonthYear(month.date)}
                                                </p>
                                                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                                    <Badge tone={view.tone}>{view.label}</Badge>
                                                    <span className="text-slate-500">
                                                        {formatCurrency(month.totalPaid)} sur{' '}
                                                        {formatCurrency(month.totalDue)}
                                                    </span>
                                                </p>

                                                {month.payments.length > 0 && (
                                                    <ul className="mt-2.5 flex flex-wrap gap-2">
                                                        {month.payments.map((payment) => (
                                                            <li
                                                                key={payment.id}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                                                            >
                                                                <span>{formatDate(payment.date)}</span>
                                                                <span className="font-semibold text-slate-900">
                                                                    {formatCurrency(payment.amount)}
                                                                </span>
                                                                <span className="text-slate-400">
                                                                    {payment.typology}
                                                                </span>
                                                                <DeletePaymentButton
                                                                    paymentId={payment.id}
                                                                    tenantId={tenant.id}
                                                                />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                                            <a
                                                href={`/api/notice/${tenant.id}?month=${month.date.getMonth() + 1}&year=${month.date.getFullYear()}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                title="Avis d'échéance"
                                            >
                                                <ReceiptText size={13} />
                                                Avis
                                            </a>
                                            {month.status === 'Paid' && (
                                                <a
                                                    href={`/api/receipt/${tenant.id}?month=${month.date.getMonth() + 1}&year=${month.date.getFullYear()}`}
                                                    target="_blank"
                                                    rel="noopener"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                                    title="Quittance de loyer"
                                                >
                                                    <FileDown size={13} />
                                                    Quittance
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </Card>

                    {/* Journal */}
                    <Card>
                        <CardHeader
                            title="Journal des encaissements"
                            description="Tous les mouvements enregistrés sur ce dossier."
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Nature</th>
                                        <th className="px-6 py-3">Période</th>
                                        <th className="px-6 py-3 text-right">Montant</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                    {tenant.payments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-10 text-center text-slate-400"
                                            >
                                                Aucun paiement enregistré.
                                            </td>
                                        </tr>
                                    ) : (
                                        tenant.payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50/70">
                                                <td className="px-6 py-3.5 text-slate-900">
                                                    {formatDate(payment.date)}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    <Badge
                                                        tone={
                                                            payment.typology === 'Depot'
                                                                ? 'warning'
                                                                : payment.typology === 'CAF'
                                                                  ? 'info'
                                                                  : 'neutral'
                                                        }
                                                    >
                                                        {PAYMENT_TYPE_LABELS[payment.typology] ??
                                                            payment.typology}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    {formatMonthYear(payment.periodStart)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-medium text-slate-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <DeletePaymentButton
                                                        paymentId={payment.id}
                                                        tenantId={tenant.id}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Colonne latérale */}
                <div className="space-y-6 lg:sticky lg:top-24">
                    <Card>
                        <CardHeader title="Enregistrer un paiement" />
                        <CardBody>
                            <PaymentForm tenantId={tenant.id} />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Coordonnées" />
                        <CardBody className="space-y-3 text-sm">
                            <p className="flex items-center gap-3 text-slate-600">
                                <Phone size={15} className="text-slate-400" />
                                {tenant.phone ? (
                                    <a
                                        href={`tel:${tenant.phone}`}
                                        className="hover:text-indigo-600"
                                    >
                                        {tenant.phone}
                                    </a>
                                ) : (
                                    <span className="text-slate-400">Non renseigné</span>
                                )}
                            </p>
                            <p className="flex items-center gap-3 text-slate-600">
                                <Mail size={15} className="shrink-0 text-slate-400" />
                                {tenant.email ? (
                                    <a
                                        href={`mailto:${tenant.email}`}
                                        className="truncate hover:text-indigo-600"
                                    >
                                        {tenant.email}
                                    </a>
                                ) : (
                                    <span className="text-slate-400">Non renseigné</span>
                                )}
                            </p>
                            <p className="flex items-start gap-3 text-slate-600">
                                <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                                <span>
                                    {tenant.address}
                                    <br />
                                    {tenant.postalCode} {tenant.city}
                                </span>
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Signatures électroniques" />
                        <CardBody>
                            <SignatureList signatureRequests={tenant.signatureRequests} />
                        </CardBody>
                    </Card>
                </div>
            </div>
        </>
    )
}
