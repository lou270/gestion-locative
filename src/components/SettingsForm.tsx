'use client';

import { updateLandlord } from "@/app/actions/landlord";
import { useState, useTransition } from "react";

interface Landlord {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    siret: string | null;
    companyName: string | null;
}

export function SettingsForm({ landlord }: { landlord: Landlord | null }) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateLandlord(formData);
            if (result.success) {
                setMessage({ type: 'success', text: result.message });
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        });
    };

    return (
        <form action={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Section Identité */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">1</span>
                    Identité
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">Prénom</label>
                        <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            defaultValue={landlord?.firstName}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">Nom</label>
                        <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            defaultValue={landlord?.lastName}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                        <label htmlFor="siret" className="block text-sm font-medium text-slate-700">SIRET (Optionnel)</label>
                        <input
                            type="text"
                            name="siret"
                            id="siret"
                            defaultValue={landlord?.siret || ''}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Nom de la Société (Si applicable)</label>
                        <input
                            type="text"
                            name="companyName"
                            id="companyName"
                            defaultValue={landlord?.companyName || ''}
                            placeholder="Ex: SCI Les Oliviers"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section Coordonnées */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">2</span>
                    Coordonnées
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700">Adresse Postale</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            defaultValue={landlord?.address || ''}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="postalCode" className="block text-sm font-medium text-slate-700">Code Postal</label>
                        <input
                            type="text"
                            name="postalCode"
                            id="postalCode"
                            defaultValue={landlord?.postalCode || ''}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700">Ville</label>
                        <input
                            type="text"
                            name="city"
                            id="city"
                            defaultValue={landlord?.city || ''}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            defaultValue={landlord?.email}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Téléphone</label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            defaultValue={landlord?.phone || ''}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 hover:bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
            </div>
        </form>
    );
}
