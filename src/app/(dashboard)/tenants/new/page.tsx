import { getProperties } from '@/app/actions/property'
import { TenantForm } from '@/components/TenantForm'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata = { title: 'Nouveau locataire · Gestion Locative' }

export default async function NewTenantPage({
    searchParams,
}: {
    searchParams: Promise<{ propertyId?: string }>
}) {
    const [{ propertyId }, result] = await Promise.all([searchParams, getProperties()])
    const properties = result.success ? result.data : []

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Nouveau locataire"
                description="Ces informations alimentent le bail, les avis d'échéance et les quittances."
                breadcrumbs={[{ label: 'Locataires', href: '/tenants' }, { label: 'Nouveau' }]}
            />

            <Card>
                <CardBody className="px-6 py-6 sm:px-8">
                    <TenantForm properties={properties} defaultPropertyId={propertyId} />
                </CardBody>
            </Card>
        </div>
    )
}
