'use client'

import { createProperty } from '@/app/actions/property'
import { useState } from 'react'

export function PropertyForm() {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await createProperty(formData)
        setLoading(false)
        const form = document.querySelector('form') as HTMLFormElement
        form?.reset()
    }

    return (
        <form action={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Nouveau Bien</h2>
            <div>
                <label className="block text-sm font-medium">Nom du bien (ex: Appartement Centre)</label>
                <input name="name" required className="border p-2 rounded w-full" />
            </div>
            <div>
                <label className="block text-sm font-medium">Type</label>
                <select name="type" className="border p-2 rounded w-full">
                    <option value="Appartement">Appartement</option>
                    <option value="Maison">Maison</option>
                    <option value="Parking">Parking</option>
                    <option value="Local Commercial">Local Commercial</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium">Adresse</label>
                <input name="address" required className="border p-2 rounded w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Code Postal</label>
                    <input name="postalCode" required className="border p-2 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Ville</label>
                    <input name="city" required className="border p-2 rounded w-full" />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
                {loading ? 'Enregistrement...' : 'Ajouter le bien'}
            </button>
        </form>
    )
}
