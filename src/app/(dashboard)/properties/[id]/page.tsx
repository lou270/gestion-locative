import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, User, Wallet } from 'lucide-react'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/auth-guard'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'
import { EditPropertyModal } from '@/components/EditPropertyModal'
import { formatCurrency, formatDate, initials } from '@/lib/format'

/** Caractéristique du logement, notamment celles exigées par la CAF. */
function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
        </div>
    )
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    await requireSession()
    const { id } = await params

    const property = await prisma.property.findUnique({
        where: { id },
        include: { tenants: { orderBy: { startDate: 'desc' } } },
    })

    if (!property) notFound()

    const now = new Date()
    const currentTenants = property.tenants.filter((t) => !t.endDate || t.endDate >= now)
    const pastTenants = property.tenants.filter((t) => t.endDate && t.endDate < now)

    return (
        <>
            <PageHeader
                title={property.name}
                breadcrumbs={[
                    { label: 'Mes biens', href: '/properties' },
                    { label: property.name },
                ]}
                description={`${property.address}, ${property.postalCode} ${property.city}`}
                action={
                    <div className="flex items-center gap-3">
                        <Badge tone="info">{property.type}</Badge>
                        <EditPropertyModal property={property} />
                    </div>
                }
            />

            <dl className="mb-8 grid gap-4 sm:grid-cols-3">
                <Detail label="Surface" value={property.surface ? `${property.surface} m²` : '—'} />
                <Detail label="Meublé" value={property.furnished ? 'Oui' : 'Non'} />
                <Detail
                    label="Chambre (pièce unique sans WC)"
                    value={property.singleRoom ? 'Oui' : 'Non'}
                />
            </dl>

            <section className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <User size={18} className="text-indigo-600" />
                    Occupation actuelle
                </h2>

                {currentTenants.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                        {currentTenants.map((tenant) => (
                            <Link
                                key={tenant.id}
                                href={`/tenants/${tenant.id}`}
                                className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-200/40 transition-all hover:border-indigo-200 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                        {initials(tenant.firstName, tenant.lastName)}
                                    </span>
                                    <Badge tone="success">Bail en cours</Badge>
                                </div>

                                <p className="mt-3 font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                                    {tenant.firstName} {tenant.lastName}
                                </p>

                                <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        Depuis le {formatDate(tenant.startDate)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Wallet size={14} className="text-slate-400" />
                                        {formatCurrency(tenant.rentAmount + tenant.chargeAmount)} /
                                        mois
                                    </div>
                                </dl>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<MapPin size={20} />}
                        title="Ce bien est vacant"
                        description="Aucun locataire n'occupe le logement actuellement."
                        action={
                            <ButtonLink href={`/tenants/new?propertyId=${property.id}`}>
                                Ajouter un locataire
                            </ButtonLink>
                        }
                    />
                )}
            </section>

            {pastTenants.length > 0 && (
                <section className="mt-10">
                    <Card>
                        <CardHeader
                            title="Historique des baux"
                            description={`${pastTenants.length} bail(s) terminé(s) sur ce bien.`}
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Locataire</th>
                                        <th className="px-6 py-3">Entrée</th>
                                        <th className="px-6 py-3">Sortie</th>
                                        <th className="px-6 py-3 text-right">Loyer charges comprises</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                    {pastTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-slate-50/70">
                                            <td className="px-6 py-3.5 font-medium text-slate-900">
                                                {tenant.firstName} {tenant.lastName}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {formatDate(tenant.startDate)}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {formatDate(tenant.endDate)}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {formatCurrency(
                                                    tenant.rentAmount + tenant.chargeAmount,
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <Link
                                                    href={`/tenants/${tenant.id}`}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Voir
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>
            )}
        </>
    )
}
