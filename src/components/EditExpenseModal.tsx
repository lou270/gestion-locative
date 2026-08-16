'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { updateExpense } from '@/app/actions/expense'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
    ExpenseFields,
    type ExpenseDefaults,
    type PropertyOption,
} from '@/components/ExpenseFields'

export function EditExpenseModal({
    expense,
    properties,
}: {
    expense: ExpenseDefaults & { id: string }
    properties: PropertyOption[]
}) {
    const [open, setOpen] = useState(false)

    const { onSubmit, pending, fieldErrors } = useActionForm(updateExpense, {
        successMessage: 'Charge mise à jour.',
        onSuccess: () => setOpen(false),
    })

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                title="Modifier la charge"
                aria-label={`Modifier ${expense.label ?? 'la charge'}`}
            >
                <Pencil size={15} />
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Modifier la charge"
                description="La date de règlement détermine l'année fiscale de rattachement."
            >
                <form key={String(open)} onSubmit={onSubmit} className="space-y-6 px-6 py-5">
                    <input type="hidden" name="id" value={expense.id} />

                    <ExpenseFields
                        defaults={expense}
                        properties={properties}
                        fieldErrors={fieldErrors}
                    />

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={pending}>
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}
