'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { updateProperty } from '@/app/actions/property'
import { useActionForm } from '@/hooks/useActionForm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PropertyFields, type PropertyDefaults } from '@/components/PropertyFields'

export function EditPropertyModal({
    property,
}: {
    property: PropertyDefaults & { id: string }
}) {
    const [open, setOpen] = useState(false)

    const { onSubmit, pending, fieldErrors } = useActionForm(updateProperty, {
        successMessage: 'Bien mis à jour.',
        onSuccess: () => setOpen(false),
    })

    return (
        <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                <Pencil size={14} />
                Modifier
            </Button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Modifier le bien"
                description="L'adresse est répercutée sur les baux rattachés."
            >
                <form key={String(open)} onSubmit={onSubmit} className="space-y-6 px-6 py-5">
                    <input type="hidden" name="id" value={property.id} />

                    <PropertyFields defaults={property} fieldErrors={fieldErrors} />

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
