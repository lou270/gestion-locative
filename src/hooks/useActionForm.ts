'use client'

import { useState, useTransition } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { ActionResult } from '@/lib/validation'

/**
 * Branche un formulaire sur une server action : état de chargement, toast de
 * succès/erreur et erreurs par champ.
 *
 * On passe par `onSubmit` plutôt que par l'attribut `action` : React
 * réinitialise le formulaire dès qu'une action se termine, y compris en cas
 * d'échec de validation — l'utilisateur perdait alors toute sa saisie. Ici le
 * formulaire n'est vidé que sur succès explicite.
 */
export function useActionForm<T>(
    action: (formData: FormData) => Promise<ActionResult<T>>,
    options: {
        successMessage?: string
        resetOnSuccess?: boolean
        onSuccess?: (data: T | undefined) => void
    } = {},
) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [pending, startTransition] = useTransition()
    const toast = useToast()

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const form = event.currentTarget
        const formData = new FormData(form)

        setFieldErrors({})
        startTransition(async () => {
            const result = await action(formData)

            if (result.success) {
                toast.success(options.successMessage ?? result.message ?? 'Enregistré.')
                if (options.resetOnSuccess) form.reset()
                options.onSuccess?.(result.data)
            } else {
                setFieldErrors(result.fieldErrors ?? {})
                toast.error(result.error)
            }
        })
    }

    return { onSubmit, pending, fieldErrors, clearErrors: () => setFieldErrors({}) }
}
