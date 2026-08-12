'use client'

import { useRouter } from 'next/navigation'
import { createTenant } from '@/app/actions/tenant'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { TenantFields, type PropertyOption } from '@/components/TenantFields'

export function TenantForm({
    properties,
    defaultPropertyId,
}: {
    properties: PropertyOption[]
    defaultPropertyId?: string
}) {
    const router = useRouter()

    const { onSubmit, pending, fieldErrors } = useActionForm(createTenant, {
        successMessage: 'Locataire ajouté.',
        onSuccess: (data) => {
            if (data?.id) router.push(`/tenants/${data.id}`)
        },
    })

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <TenantFields
                properties={properties}
                defaults={{ propertyId: defaultPropertyId ?? null }}
                fieldErrors={fieldErrors}
            />

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Annuler
                </Button>
                <Button type="submit" loading={pending}>
                    Ajouter le locataire
                </Button>
            </div>
        </form>
    )
}
