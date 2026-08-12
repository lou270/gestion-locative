'use client'

import { createProperty } from '@/app/actions/property'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { PropertyFields } from '@/components/PropertyFields'

export function PropertyForm() {
    const { onSubmit, pending, fieldErrors } = useActionForm(createProperty, {
        successMessage: 'Bien ajouté.',
        resetOnSuccess: true,
    })

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <PropertyFields fieldErrors={fieldErrors} />

            <Button type="submit" loading={pending} className="w-full">
                Ajouter le bien
            </Button>
        </form>
    )
}
