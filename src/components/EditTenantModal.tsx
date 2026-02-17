
'use client'

import { useState } from 'react'
import { updateTenant } from '@/app/actions/tenant'

interface EditTenantModalProps {
    tenant: any
    properties: any[]
}

export function EditTenantModal({ tenant, properties }: EditTenantModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState(tenant.propertyId || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        formData.append('id', tenant.id)
        await updateTenant(formData)
        setIsSubmitting(false)
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
                title="Modifier les informations"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-gray-900">Modifier le locataire</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label className="block text-sm font-semibold text-blue-900 mb-2">Rattachement au bien</label>
                        <select
                            name="propertyId"
                            className="w-full border border-blue-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                        >
                            <option value="">-- Aucun bien lié (adresse manuelle) --</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                            <input name="firstName" defaultValue={tenant.firstName} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                            <input name="lastName" defaultValue={tenant.lastName} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input name="email" type="email" defaultValue={tenant.email || ''} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <input name="phone" type="tel" defaultValue={tenant.phone || ''} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>

                    {!selectedPropertyId && (
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="font-semibold text-gray-900 mb-3 block">Adresse du locataire</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <input name="address" defaultValue={tenant.address} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code Postal</label>
                                        <input name="postalCode" defaultValue={tenant.postalCode} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                        <input name="city" defaultValue={tenant.city} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loyer HC</label>
                            <div className="relative">
                                <input name="rentAmount" type="number" step="0.01" defaultValue={tenant.rentAmount} required className="w-full border border-gray-300 rounded-lg p-2 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <span className="absolute right-3 top-2 text-gray-400">€</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Charges</label>
                            <div className="relative">
                                <input name="chargeAmount" type="number" step="0.01" defaultValue={tenant.chargeAmount} required className="w-full border border-gray-300 rounded-lg p-2 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <span className="absolute right-3 top-2 text-gray-400">€</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée</label>
                            <input
                                name="startDate"
                                type="date"
                                defaultValue={tenant.startDate ? new Date(tenant.startDate).toISOString().split('T')[0] : ''}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm disabled:opacity-70"
                        >
                            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
