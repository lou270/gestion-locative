'use client'

import { useState } from 'react'
import { SelectField, TextField } from '@/components/ui/Field'
import {
    EXPENSE_CATEGORIES,
    EXPENSE_CATEGORY_HINTS,
    EXPENSE_CATEGORY_LABELS,
} from '@/lib/expenses'
import { toDateInputValue } from '@/lib/dates'

export interface ExpenseDefaults {
    category?: string
    label?: string
    amount?: number
    date?: Date | string
    propertyId?: string | null
    note?: string | null
}

export interface PropertyOption {
    id: string
    name: string
}

/** Champs communs à la création et à la modification d'une charge. */
export function ExpenseFields({
    defaults = {},
    properties,
    fieldErrors = {},
}: {
    defaults?: ExpenseDefaults
    properties: PropertyOption[]
    fieldErrors?: Record<string, string>
}) {
    const [category, setCategory] = useState(defaults.category ?? EXPENSE_CATEGORIES[0])

    return (
        <div className="space-y-5">
            <SelectField
                label="Catégorie"
                name="category"
                required
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                hint={EXPENSE_CATEGORY_HINTS[category]}
                error={fieldErrors.category}
            >
                {EXPENSE_CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                        {EXPENSE_CATEGORY_LABELS[value]}
                    </option>
                ))}
            </SelectField>

            <TextField
                label="Libellé"
                name="label"
                required
                placeholder="Taxe foncière 2025"
                hint="Ce que vous retrouverez dans le journal exporté."
                defaultValue={defaults.label ?? ''}
                error={fieldErrors.label}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Montant"
                    name="amount"
                    required
                    inputMode="decimal"
                    suffix="€"
                    placeholder="900"
                    defaultValue={defaults.amount ?? ''}
                    error={fieldErrors.amount}
                />
                <TextField
                    label="Date de règlement"
                    name="date"
                    type="date"
                    required
                    hint="Date du décaissement."
                    defaultValue={toDateInputValue(defaults.date ?? new Date())}
                    error={fieldErrors.date}
                />
            </div>

            <SelectField
                label="Bien concerné"
                name="propertyId"
                defaultValue={defaults.propertyId ?? ''}
                hint="La CFE ou les honoraires comptables peuvent rester non affectés."
                error={fieldErrors.propertyId}
            >
                <option value="">Non affectée à un bien</option>
                {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                        {property.name}
                    </option>
                ))}
            </SelectField>

            <TextField
                label="Note"
                name="note"
                placeholder="Facultatif"
                defaultValue={defaults.note ?? ''}
                error={fieldErrors.note}
            />
        </div>
    )
}
