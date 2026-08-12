'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
            </span>

            <h1 className="text-xl font-bold text-slate-900">Une erreur est survenue</h1>
            <p className="mt-2 max-w-md text-sm text-slate-500">
                La page n’a pas pu être affichée. Réessayez ; si le problème persiste, vérifiez les
                journaux du serveur.
            </p>
            {error.digest && (
                <code className="mt-3 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    Référence : {error.digest}
                </code>
            )}

            <div className="mt-6 flex gap-3">
                <Button onClick={reset}>Réessayer</Button>
                <ButtonLink href="/" variant="secondary">
                    Tableau de bord
                </ButtonLink>
            </div>
        </div>
    )
}
