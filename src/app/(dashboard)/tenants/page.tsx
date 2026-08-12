import { Plus } from 'lucide-react'
import { getTenantsOverview } from '@/app/actions/tenant'
import { TenantDirectory } from '@/components/TenantDirectory'
import { PageHeader } from '@/components/ui/PageHeader'
import { ButtonLink } from '@/components/ui/Button'

export const metadata = { title: 'Locataires · Gestion Locative' }

export default async function TenantsPage() {
    const result = await getTenantsOverview()
    const tenants = result.success ? result.data : []

    return (
        <>
            <PageHeader
                title="Locataires"
                description="Tous les baux, en cours comme archivés."
                action={
                    <ButtonLink href="/tenants/new">
                        <Plus size={17} />
                        Nouveau locataire
                    </ButtonLink>
                }
            />

            {!result.success && (
                <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {result.error}
                </p>
            )}

            <TenantDirectory tenants={tenants} />
        </>
    )
}
