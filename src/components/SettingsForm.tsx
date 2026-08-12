'use client'

import { updateLandlord } from '@/app/actions/landlord'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'

interface Landlord {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    siret: string | null
    companyName: string | null
}

export function SettingsForm({ landlord }: { landlord: Landlord | null }) {
    const { onSubmit, pending, fieldErrors } = useActionForm(updateLandlord)

    return (
        <form onSubmit={onSubmit} className="space-y-8 px-6 py-6 sm:px-8">
            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Identité</h2>
                    <p className="text-sm text-slate-500">
                        Apparaît en tant que bailleur sur les quittances et les baux.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Prénom"
                        name="firstName"
                        required
                        defaultValue={landlord?.firstName ?? ''}
                        error={fieldErrors.firstName}
                        autoComplete="given-name"
                    />
                    <TextField
                        label="Nom"
                        name="lastName"
                        required
                        defaultValue={landlord?.lastName ?? ''}
                        error={fieldErrors.lastName}
                        autoComplete="family-name"
                    />
                    <TextField
                        label="Société ou SCI"
                        name="companyName"
                        placeholder="SCI Les Oliviers"
                        hint="Si renseigné, remplace le nom sur les documents."
                        defaultValue={landlord?.companyName ?? ''}
                        error={fieldErrors.companyName}
                    />
                    <TextField
                        label="SIRET"
                        name="siret"
                        inputMode="numeric"
                        placeholder="14 chiffres"
                        defaultValue={landlord?.siret ?? ''}
                        error={fieldErrors.siret}
                    />
                </div>
            </section>

            <hr className="border-slate-100" />

            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Coordonnées</h2>
                    <p className="text-sm text-slate-500">
                        Adresse d’envoi et contact figurant sur les courriers.
                    </p>
                </div>

                <TextField
                    label="Adresse postale"
                    name="address"
                    defaultValue={landlord?.address ?? ''}
                    error={fieldErrors.address}
                    autoComplete="street-address"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Code postal"
                        name="postalCode"
                        inputMode="numeric"
                        maxLength={5}
                        defaultValue={landlord?.postalCode ?? ''}
                        error={fieldErrors.postalCode}
                        autoComplete="postal-code"
                    />
                    <TextField
                        label="Ville"
                        name="city"
                        defaultValue={landlord?.city ?? ''}
                        error={fieldErrors.city}
                        autoComplete="address-level2"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        required
                        defaultValue={landlord?.email ?? ''}
                        error={fieldErrors.email}
                        autoComplete="email"
                    />
                    <TextField
                        label="Téléphone"
                        name="phone"
                        type="tel"
                        defaultValue={landlord?.phone ?? ''}
                        error={fieldErrors.phone}
                        autoComplete="tel"
                    />
                </div>
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-6">
                <Button type="submit" loading={pending}>
                    Enregistrer les modifications
                </Button>
            </div>
        </form>
    )
}
