'use client'

import { useState, useTransition } from 'react'
import { TrendingUp } from 'lucide-react'
import { applyRentRevision, calculateNewRent } from '@/app/actions/rent-revision'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/Field'
import { formatCurrency } from '@/lib/format'

export function RentRevisionButton({
    tenantId,
    currentRent,
}: {
    tenantId: string
    currentRent: number
}) {
    const [open, setOpen] = useState(false)
    const [oldIndex, setOldIndex] = useState('')
    const [newIndex, setNewIndex] = useState('')
    const [simulation, setSimulation] = useState<{ newRent: number; percentage: number } | null>(
        null,
    )
    const [pending, startTransition] = useTransition()
    const toast = useToast()

    const reset = () => {
        setSimulation(null)
        setOldIndex('')
        setNewIndex('')
    }

    const close = () => {
        setOpen(false)
        reset()
    }

    const handleSimulate = () => {
        startTransition(async () => {
            const result = await calculateNewRent(
                currentRent,
                Number(oldIndex.replace(',', '.')),
                Number(newIndex.replace(',', '.')),
            )
            if (result.success && result.data) setSimulation(result.data)
            else if (!result.success) toast.error(result.error)
        })
    }

    const handleApply = () => {
        if (!simulation) return
        startTransition(async () => {
            const result = await applyRentRevision(tenantId, simulation.newRent)
            if (result.success) {
                toast.success(`Loyer révisé à ${formatCurrency(simulation.newRent)}.`)
                close()
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
            >
                <TrendingUp size={13} />
                Réviser
            </button>

            <Modal
                open={open}
                onClose={close}
                title="Révision du loyer (IRL)"
                description={`Loyer actuel : ${formatCurrency(currentRent)} hors charges.`}
                className="max-w-md"
            >
                <div className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Ancien indice"
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="139.76"
                            value={oldIndex}
                            onChange={(event) => {
                                setOldIndex(event.target.value)
                                setSimulation(null)
                            }}
                        />
                        <TextField
                            label="Nouvel indice"
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="142.03"
                            value={newIndex}
                            onChange={(event) => {
                                setNewIndex(event.target.value)
                                setSimulation(null)
                            }}
                        />
                    </div>

                    <p className="text-xs text-slate-500">
                        Indices de référence des loyers publiés par l’INSEE, au trimestre prévu par
                        le bail.
                    </p>

                    {simulation && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-medium text-indigo-900">
                                    Nouveau loyer
                                </span>
                                <span className="text-xl font-bold text-indigo-700">
                                    {formatCurrency(simulation.newRent)}
                                </span>
                            </div>
                            <p className="mt-1 text-right text-xs text-indigo-600">
                                {simulation.percentage >= 0 ? '+' : ''}
                                {simulation.percentage} % · soit{' '}
                                {formatCurrency(simulation.newRent - currentRent)} par mois
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <Button type="button" variant="secondary" onClick={close}>
                            Annuler
                        </Button>
                        {simulation ? (
                            <Button
                                type="button"
                                variant="success"
                                loading={pending}
                                onClick={handleApply}
                            >
                                Appliquer le nouveau loyer
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                loading={pending}
                                disabled={!oldIndex || !newIndex}
                                onClick={handleSimulate}
                            >
                                Calculer
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}
