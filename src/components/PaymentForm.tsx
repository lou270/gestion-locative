'use client'

import { recordPayment } from '@/app/actions/tenant'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from '@/lib/ledger'
import { toDateInputValue } from '@/lib/dates'

const MONTHS = Array.from({ length: 12 }, (_, index) => {
    const label = new Date(2000, index, 1).toLocaleString('fr-FR', { month: 'long' })
    return { value: index + 1, label: label.charAt(0).toUpperCase() + label.slice(1) }
})

export function PaymentForm({
    tenantId,
    defaultMonth,
    defaultYear,
    defaultAmount,
}: {
    tenantId: string
    defaultMonth?: number
    defaultYear?: number
    defaultAmount?: number
}) {
    const now = new Date()

    const { onSubmit, pending, fieldErrors } = useActionForm(recordPayment, {
        successMessage: 'Paiement enregistré.',
        resetOnSuccess: true,
    })

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="tenantId" value={tenantId} />

            <TextField
                label="Montant"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                suffix="€"
                placeholder="500,00"
                defaultValue={defaultAmount ?? ''}
                error={fieldErrors.amount}
            />

            <TextField
                label="Date d'encaissement"
                name="date"
                type="date"
                required
                defaultValue={toDateInputValue(now)}
                error={fieldErrors.date}
            />

            <div className="grid grid-cols-2 gap-3">
                <SelectField
                    label="Mois concerné"
                    name="periodMonth"
                    defaultValue={defaultMonth ?? now.getMonth() + 1}
                    error={fieldErrors.periodMonth}
                >
                    {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </SelectField>

                <TextField
                    label="Année"
                    name="periodYear"
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    defaultValue={defaultYear ?? now.getFullYear()}
                    error={fieldErrors.periodYear}
                />
            </div>

            <SelectField
                label="Nature"
                name="type"
                defaultValue="Loyer"
                error={fieldErrors.type}
                hint="Le dépôt de garantie est suivi à part, hors solde de loyer."
            >
                {PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                        {PAYMENT_TYPE_LABELS[type]}
                    </option>
                ))}
            </SelectField>

            <Button type="submit" loading={pending} className="w-full">
                Enregistrer le paiement
            </Button>
        </form>
    )
}
