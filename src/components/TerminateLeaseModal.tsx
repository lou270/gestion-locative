'use client'

import { terminateLease } from '@/app/actions/tenant'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/Field'
import { toDateInputValue } from '@/lib/dates'

export function TerminateLeaseModal({
    open,
    onClose,
    tenantId,
    existingEndDate,
}: {
    open: boolean
    onClose: () => void
    tenantId: string
    existingEndDate?: string | null
}) {
    const { onSubmit, pending, fieldErrors } = useActionForm(terminateLease, {
        successMessage: 'Fin de bail enregistrée.',
        onSuccess: onClose,
    })

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Clôturer le bail"
            description="Les loyers cessent d'être dus après cette date, au prorata du dernier mois."
            className="max-w-md"
        >
            <form key={String(open)} onSubmit={onSubmit} className="space-y-5 px-6 py-5">
                <input type="hidden" name="tenantId" value={tenantId} />

                <TextField
                    label="Date de sortie"
                    name="endDate"
                    type="date"
                    required
                    defaultValue={toDateInputValue(existingEndDate)}
                    error={fieldErrors.endDate}
                />

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" variant="danger" loading={pending}>
                        Confirmer la sortie
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
