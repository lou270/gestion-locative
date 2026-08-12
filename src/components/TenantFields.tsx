'use client'

import { useState } from 'react'
import { SelectField, TextField } from '@/components/ui/Field'
import { toDateInputValue } from '@/lib/dates'

export interface PropertyOption {
    id: string
    name: string
    address: string
}

export interface TenantDefaults {
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    propertyId?: string | null
    address?: string
    postalCode?: string
    city?: string
    rentAmount?: number
    chargeAmount?: number
    startDate?: Date | string | null
}

/**
 * Champs communs à la création et à la modification d'un locataire.
 * Ils étaient dupliqués entre `TenantForm` et `EditTenantModal`, avec des
 * libellés et des règles qui avaient déjà divergé.
 */
export function TenantFields({
    properties,
    defaults = {},
    fieldErrors = {},
}: {
    properties: PropertyOption[]
    defaults?: TenantDefaults
    fieldErrors?: Record<string, string>
}) {
    const [propertyId, setPropertyId] = useState(defaults.propertyId ?? '')

    return (
        <div className="space-y-6">
            <SelectField
                label="Bien loué"
                name="propertyId"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                error={fieldErrors.propertyId}
                hint={
                    propertyId
                        ? "L'adresse du bail est reprise automatiquement depuis le bien."
                        : 'Sans bien rattaché, saisissez l’adresse du logement ci-dessous.'
                }
            >
                <option value="">Aucun bien — adresse manuelle</option>
                {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                        {property.name} — {property.address}
                    </option>
                ))}
            </SelectField>

            <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-slate-900 mb-2">Locataire</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Prénom"
                        name="firstName"
                        required
                        defaultValue={defaults.firstName ?? ''}
                        error={fieldErrors.firstName}
                        autoComplete="given-name"
                    />
                    <TextField
                        label="Nom"
                        name="lastName"
                        required
                        defaultValue={defaults.lastName ?? ''}
                        error={fieldErrors.lastName}
                        autoComplete="family-name"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        defaultValue={defaults.email ?? ''}
                        error={fieldErrors.email}
                        hint="Nécessaire pour la signature électronique du bail."
                        autoComplete="email"
                    />
                    <TextField
                        label="Téléphone"
                        name="phone"
                        type="tel"
                        defaultValue={defaults.phone ?? ''}
                        error={fieldErrors.phone}
                        autoComplete="tel"
                    />
                </div>
            </fieldset>

            {!propertyId && (
                <fieldset className="space-y-4">
                    <legend className="text-sm font-semibold text-slate-900 mb-2">
                        Adresse du logement
                    </legend>
                    <TextField
                        label="Adresse"
                        name="address"
                        required
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
                            defaultValue={defaults.postalCode ?? ''}
                            error={fieldErrors.postalCode}
                        />
                        <TextField
                            label="Ville"
                            name="city"
                            required
                            defaultValue={defaults.city ?? ''}
                            error={fieldErrors.city}
                        />
                    </div>
                </fieldset>
            )}

            <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-slate-900 mb-2">Bail</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                    <TextField
                        label="Loyer hors charges"
                        name="rentAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        suffix="€"
                        defaultValue={defaults.rentAmount ?? ''}
                        error={fieldErrors.rentAmount}
                    />
                    <TextField
                        label="Charges"
                        name="chargeAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        suffix="€"
                        defaultValue={defaults.chargeAmount ?? ''}
                        error={fieldErrors.chargeAmount}
                    />
                    <TextField
                        label="Date d'entrée"
                        name="startDate"
                        type="date"
                        required
                        defaultValue={toDateInputValue(defaults.startDate)}
                        error={fieldErrors.startDate}
                    />
                </div>
            </fieldset>
        </div>
    )
}
