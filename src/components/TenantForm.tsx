'use client'

import { createTenant } from '@/app/actions'
import { useState } from 'react'

interface TenantFormProps {
    properties: any[]
}

export function TenantForm({ properties }: TenantFormProps) {
    const [loading, setLoading] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setMessage(null)

        const result = await createTenant(formData)

        setLoading(false)

        if (result.success) {
            setMessage({ type: 'success', text: 'Le locataire a été ajouté avec succès !' })
            const form = document.querySelector('form') as HTMLFormElement
            form?.reset()
            setSelectedPropertyId('')

            // Masquer le message après 5 secondes
            setTimeout(() => setMessage(null), 5000)
        } else {
            setMessage({ type: 'error', text: result.error || 'Une erreur est survenue.' })
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Locataire</h2>

            {message && (
                <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-blue-50 p-3 rounded mb-4">
                <label className="block text-sm font-semibold mb-1">Rattacher à un bien (Optionnel)</label>
                <select
                    name="propertyId"
                    className="border p-2 rounded w-full"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                    <option value="">-- Aucun bien lié (adresse manuelle) --</option>
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="Prénom" required className="border p-2 rounded" />
                <input name="lastName" placeholder="Nom" required className="border p-2 rounded" />
                <input name="email" type="email" placeholder="Email" className="border p-2 rounded" />
                <input name="phone" type="tel" placeholder="Téléphone" className="border p-2 rounded" />
            </div>

            {!selectedPropertyId && (
                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Adresse du Bien</h3>
                    <input name="address" placeholder="Adresse" required className="border p-2 rounded w-full mb-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="postalCode" placeholder="Code Postal" required className="border p-2 rounded" />
                        <input name="city" placeholder="Ville" required className="border p-2 rounded" />
                    </div>
                </div>
            )}
            <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Loyer HC</label>
                    <input name="rentAmount" type="number" step="0.01" required className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm">Charges</label>
                    <input name="chargeAmount" type="number" step="0.01" required className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm">Date d'entrée</label>
                    <input name="startDate" type="date" required className="border p-2 rounded w-full" />
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                {loading ? 'Enregistrement...' : 'Ajouter le locataire'}
            </button>
        </form>
    )
}
