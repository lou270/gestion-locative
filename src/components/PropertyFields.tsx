'use client'

import { SelectField, TextField } from '@/components/ui/Field'
import { Checkbox } from '@/components/ui/Checkbox'
import { PROPERTY_TYPES } from '@/lib/validation'

export interface PropertyDefaults {
    name?: string
    type?: string
    address?: string
    postalCode?: string
    city?: string
    surface?: number | null
    furnished?: boolean
    singleRoom?: boolean
}

/** Champs communs à la création et à la modification d'un bien. */
export function PropertyFields({
    defaults = {},
    fieldErrors = {},
}: {
    defaults?: PropertyDefaults
    fieldErrors?: Record<string, string>
}) {
    return (
        <div className="space-y-5">
            <TextField
                label="Nom du bien"
                name="name"
                required
                placeholder="Appartement Centre-ville"
                hint="Nom court utilisé dans les listes et les documents."
                defaultValue={defaults.name ?? ''}
                error={fieldErrors.name}
            />

            <SelectField
                label="Type"
                name="type"
                defaultValue={defaults.type ?? 'Appartement'}
                error={fieldErrors.type}
            >
                {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </SelectField>

            <TextField
                label="Adresse"
                name="address"
                required
                placeholder="12 rue des Lilas"
                defaultValue={defaults.address ?? ''}
                error={fieldErrors.address}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Code postal"
                    name="postalCode"
                    required
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="75011"
                    defaultValue={defaults.postalCode ?? ''}
                    error={fieldErrors.postalCode}
                />
                <TextField
                    label="Ville"
                    name="city"
                    required
                    placeholder="Paris"
                    defaultValue={defaults.city ?? ''}
                    error={fieldErrors.city}
                />
            </div>

            <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Caractéristiques (attestation CAF)
                </legend>

                <TextField
                    label="Surface réelle"
                    name="surface"
                    type="number"
                    step="0.01"
                    min="1"
                    suffix="m²"
                    placeholder="45"
                    defaultValue={defaults.surface ?? ''}
                    error={fieldErrors.surface}
                />

                <Checkbox
                    label="Logement meublé"
                    name="furnished"
                    defaultChecked={defaults.furnished ?? false}
                    hint="Le loyer sera déclaré charges comprises."
                />

                <Checkbox
                    label="Chambre — pièce unique sans WC"
                    name="singleRoom"
                    defaultChecked={defaults.singleRoom ?? false}
                />
            </fieldset>
        </div>
    )
}
