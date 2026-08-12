'use client'

import { useActionState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { authenticate } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'

export default function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

    return (
        <form action={dispatch} className="space-y-4">
            <TextField
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.fr"
            />

            <TextField
                label="Mot de passe"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="••••••••"
            />

            <div aria-live="polite" aria-atomic="true">
                {errorMessage && (
                    <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        <AlertTriangle size={15} className="shrink-0" />
                        {errorMessage}
                    </p>
                )}
            </div>

            <Button type="submit" loading={isPending} className="w-full">
                Se connecter
            </Button>
        </form>
    )
}
