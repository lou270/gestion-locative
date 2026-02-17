'use client'

import { recordPayment } from '@/app/actions/tenant'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PaymentForm({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await recordPayment(formData)
        setLoading(false)
        if (result.success) {
            const form = document.querySelector('#payment-form') as HTMLFormElement
            form?.reset()
            // Router refresh handled by server action revalidatePath normally, 
            // but explicitly calling router.refresh() ensures client state update if needed.
        }
    }

    return (
        <form id="payment-form" action={handleSubmit} className="space-y-3">
            <input type="hidden" name="tenantId" value={tenantId} />

            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date du paiement</label>
                <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full border p-2 rounded text-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Montant (€)</label>
                <input
                    type="number"
                    step="0.01"
                    name="amount"
                    placeholder="ex: 500.00"
                    required
                    className="w-full border p-2 rounded text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mois du Loyer</label>
                    <select name="periodMonth" defaultValue={new Date().getMonth() + 1} className="w-full border p-2 rounded text-sm">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Année</label>
                    <input
                        type="number"
                        name="periodYear"
                        defaultValue={new Date().getFullYear()}
                        required
                        className="w-full border p-2 rounded text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select name="type" className="w-full border p-2 rounded text-sm">
                    <option value="Loyer">Loyer</option>
                    <option value="CAF">CAF (Allocation Logement)</option>
                    <option value="Regularisation">Régularisation Charges</option>
                    <option value="Depot">Dépôt de Garantie</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition"
            >
                {loading ? 'Enregistrement...' : 'Valider le Paiement'}
            </button>
        </form>
    )
}
