'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { updateTenant } from '@/app/actions/tenant'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TenantFields, type PropertyOption, type TenantDefaults } from '@/components/TenantFields'

export function EditTenantModal({
    tenant,
    properties,
}: {
    tenant: TenantDefaults & { id: string }
    properties: PropertyOption[]
}) {
    const [open, setOpen] = useState(false)

    const { onSubmit, pending, fieldErrors } = useActionForm(updateTenant, {
        successMessage: 'Locataire mis à jour.',
        onSuccess: () => setOpen(false),
    })

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                title="Modifier la fiche du locataire"
                aria-label="Modifier la fiche du locataire"
            >
                <Pencil size={16} />
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Modifier le locataire"
                description="Les documents générés reprendront ces informations."
            >
                {/* `key` force la réinitialisation des champs à chaque ouverture. */}
                <form key={String(open)} onSubmit={onSubmit} className="px-6 py-5 space-y-8">
                    <input type="hidden" name="id" value={tenant.id} />

                    <TenantFields
                        properties={properties}
                        defaults={tenant}
                        fieldErrors={fieldErrors}
                    />

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" loading={pending}>
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    )
}
