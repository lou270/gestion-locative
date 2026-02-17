'use client';

import { useState } from 'react';
import { terminateLease } from '@/app/actions/tenant';

export function TerminateLeaseButton({ tenantId, existingEndDate }: { tenantId: string, existingEndDate?: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    // Initialiser avec la date existante ou la date du jour
    const [endDate, setEndDate] = useState(
        existingEndDate
            ? new Date(existingEndDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [isLoading, setIsLoading] = useState(false);

    const isEditing = !!existingEndDate;

    const handleTerminate = async () => {
        setIsLoading(true);
        try {
            await terminateLease(tenantId, new Date(endDate));
            setIsOpen(false);
            // Optional: You might want to refresh the page or show a toast
        } catch (e) {
            alert("Erreur lors de la modification du bail.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isEditing
                        ? "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                        : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    }`}
            >
                {isEditing ? "Modifier la date de sortie" : "Terminer le bail"}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">
                            {isEditing ? "Modifier la date de sortie" : "Terminer le bail"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {isEditing
                                ? "Modifiez la date de fin du bail. Les calculs de loyers seront mis à jour."
                                : "Veuillez sélectionner la date de fin du bail. Cette action est irréversible."
                            }
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date de sortie</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleTerminate}
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Traitement...' : 'Confirmer la fin du bail'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
