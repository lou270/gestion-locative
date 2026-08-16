'use client'

import { createExpense } from '@/app/actions/expense'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { ExpenseFields, type PropertyOption } from '@/components/ExpenseFields'

export function ExpenseForm({ properties }: { properties: PropertyOption[] }) {
    const { onSubmit, pending, fieldErrors } = useActionForm(createExpense, {
        successMessage: 'Charge enregistrée.',
        resetOnSuccess: true,
    })

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <ExpenseFields properties={properties} fieldErrors={fieldErrors} />

            <Button type="submit" loading={pending} className="w-full">
                Enregistrer la charge
            </Button>
        </form>
    )
}
