import Link from 'next/link'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { getProperties } from '@/app/actions/property'
import { PropertyForm } from '@/components/PropertyForm'
import { DeletePropertyButton } from '@/components/DeletePropertyButton'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata = { title: 'Mes biens · Gestion Locative' }

export default async function PropertiesPage() {
    const result = await getProperties()
    const properties = result.success ? result.data : []

    return (
        <>
            <PageHeader title="Mes biens" description="Le parc immobilier que vous gérez." />

            {!result.success && (
                <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {result.error}
                </p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader
                        title={`Biens enregistrés (${properties.length})`}
                        description="Un bien peut accueillir plusieurs baux successifs."
                    />
                    <CardBody className="px-3 py-3">
                        {properties.length === 0 ? (
                            <EmptyState
                                icon={<Building2 size={20} />}
                                title="Aucun bien enregistré"
                                description="Commencez par déclarer un logement pour y rattacher vos locataires."
                                className="border-0 bg-transparent"
                            />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {properties.map((property) => {
                                    const occupied = property.tenants.length > 0
                                    return (
                                        <li
                                            key={property.id}
                                            className="flex items-center gap-3 px-3 py-3.5"
                                        >
                                            <Link
                                                href={`/properties/${property.id}`}
                                                className="group min-w-0 flex-1"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                                                        {property.name}
                                                    </span>
                                                    <Badge tone={occupied ? 'success' : 'neutral'}>
                                                        {occupied ? 'Occupé' : 'Vacant'}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
                                                    <MapPin size={13} className="shrink-0" />
                                                    {property.address}, {property.postalCode}{' '}
                                                    {property.city}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {property.type} ·{' '}
                                                    {property._count.tenants} bail(s) au total
                                                </p>
                                            </Link>

                                            <div className="flex shrink-0 items-center gap-1">
                                                {!occupied && (
                                                    <DeletePropertyButton
                                                        propertyId={property.id}
                                                        propertyName={property.name}
                                                    />
                                                )}
                                                <Link
                                                    href={`/properties/${property.id}`}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                                    aria-label={`Voir le détail de ${property.name}`}
                                                >
                                                    <ArrowRight size={16} />
                                                </Link>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </CardBody>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader
                        title="Ajouter un bien"
                        description="L'adresse alimentera les baux et quittances."
                    />
                    <CardBody>
                        <PropertyForm />
                    </CardBody>
                </Card>
            </div>
        </>
    )
}
