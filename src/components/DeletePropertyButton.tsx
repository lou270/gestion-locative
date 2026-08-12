'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProperty } from '@/app/actions/property'
import { useToast } from '@/components/ui/Toast'

export function DeletePropertyButton({
    propertyId,
    propertyName,
}: {
    propertyId: string
    propertyName: string
}) {
    const [pending, startTransition] = useTransition()
    const toast = useToast()

    const handleDelete = () => {
        if (!confirm(`Supprimer « ${propertyName} » ? Cette action est irréversible.`)) return

        startTransition(async () => {
            const result = await deleteProperty(propertyId)
            if (result.success) toast.success('Bien supprimé.')
            else toast.error(result.error)
        })
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Supprimer le bien"
            aria-label={`Supprimer le bien ${propertyName}`}
        >
            <Trash2 size={16} />
        </button>
    )
}
