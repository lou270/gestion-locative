'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deletePayment } from '@/app/actions/tenant'
import { useToast } from '@/components/ui/Toast'

export function DeletePaymentButton({
    paymentId,
    tenantId,
    label,
}: {
    paymentId: string
    tenantId: string
    label?: string
}) {
    const [pending, startTransition] = useTransition()
    const toast = useToast()

    const handleDelete = () => {
        if (!confirm('Supprimer définitivement ce paiement ?')) return

        startTransition(async () => {
            const result = await deletePayment(paymentId, tenantId)
            if (result.success) toast.success('Paiement supprimé.')
            else toast.error(result.error)
        })
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Supprimer le paiement"
            aria-label={label ?? 'Supprimer le paiement'}
        >
            <Trash2 size={15} />
            {label && <span className="text-xs font-medium">{label}</span>}
        </button>
    )
}
