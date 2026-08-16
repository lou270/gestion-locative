'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteExpense } from '@/app/actions/expense'
import { useToast } from '@/components/ui/Toast'

export function DeleteExpenseButton({
    expenseId,
    label,
}: {
    expenseId: string
    label: string
}) {
    const [pending, startTransition] = useTransition()
    const toast = useToast()

    const handleDelete = () => {
        if (!confirm(`Supprimer définitivement la charge « ${label} » ?`)) return

        startTransition(async () => {
            const result = await deleteExpense(expenseId)
            if (result.success) toast.success('Charge supprimée.')
            else toast.error(result.error)
        })
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Supprimer la charge"
            aria-label={`Supprimer ${label}`}
        >
            <Trash2 size={15} />
        </button>
    )
}
