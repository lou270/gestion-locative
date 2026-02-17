
'use client'

import { useState } from 'react'
import { calculateNewRent, applyRentRevision } from '@/app/actions/rent-revision'

export function RentRevisionButton({ tenantId, currentRent }: { tenantId: string, currentRent: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [oldIndex, setOldIndex] = useState('')
    const [newIndex, setNewIndex] = useState('')
    const [simulation, setSimulation] = useState<{ newRent: number, percentage: number } | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSimulate = async () => {
        setLoading(true)
        const res = await calculateNewRent(currentRent, parseFloat(oldIndex), parseFloat(newIndex))
        if (res.success && res.data) {
            setSimulation(res.data)
        } else {
            alert('Erreur de calcul. Vérifiez les indices.')
        }
        setLoading(false)
    }

    const handleApply = async () => {
        if (!simulation) return
        if (!confirm(`Confirmer le passage du loyer de ${currentRent}€ à ${simulation.newRent}€ ?`)) return

        setLoading(true)
        const res = await applyRentRevision(tenantId, simulation.newRent)
        if (res.success) {
            setIsOpen(false)
            setSimulation(null)
            setOldIndex('')
            setNewIndex('')
        } else {
            alert('Erreur lors de la mise à jour.')
        }
        setLoading(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200 hover:decoration-indigo-800 underline-offset-2 transition-all font-medium flex items-center gap-1"
            >
                <span>📈</span> Réviser
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                            <h3 className="text-lg font-bold text-slate-800">Révision du Loyer (IRL)</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ancien Indice</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={oldIndex}
                                    onChange={(e) => setOldIndex(e.target.value)}
                                    placeholder="Ex: 139.76"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nouvel Indice</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newIndex}
                                    onChange={(e) => setNewIndex(e.target.value)}
                                    placeholder="Ex: 142.03"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {simulation && (
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-indigo-800 font-medium">Nouveau Loyer :</span>
                                    <span className="text-lg font-bold text-indigo-700">{simulation.newRent.toFixed(2)} €</span>
                                </div>
                                <div className="text-xs text-indigo-600 text-right">
                                    +{simulation.percentage}% d'augmentation
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {!simulation ? (
                                <button
                                    onClick={handleSimulate}
                                    disabled={!oldIndex || !newIndex || loading}
                                    className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium disabled:opacity-50"
                                >
                                    Calculer la révision
                                </button>
                            ) : (
                                <button
                                    onClick={handleApply}
                                    disabled={loading}
                                    className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 shadow-sm shadow-emerald-200"
                                >
                                    Valider et Appliquer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
