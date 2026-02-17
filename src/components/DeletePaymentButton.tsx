'use client'

import { deletePayment } from '@/app/actions/tenant'
import { useState } from 'react'

export function DeletePaymentButton({ paymentId, tenantId }: { paymentId: string, tenantId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;

        setLoading(true)
        await deletePayment(paymentId, tenantId)
        setLoading(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-400 hover:text-red-600 px-2 text-xs"
            title="Supprimer ce paiement"
        >
            {loading ? '...' : '🗑️'}
        </button>
    )
}
