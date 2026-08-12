'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PenLine } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

/** Envoie un PDF de bail à la signature électronique (Yousign). */
export function SignButton({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const toast = useToast()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('tenantId', tenantId)
            formData.append('file', file)

            const response = await fetch('/api/signatures', { method: 'POST', body: formData })

            if (response.ok) {
                toast.success('Demande de signature envoyée au locataire.')
                router.refresh()
            } else {
                const body = await response.json().catch(() => null)
                toast.error(body?.error ?? "L'envoi a échoué.")
            }
        } catch {
            toast.error('Impossible de contacter le service de signature.')
        } finally {
            setLoading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                id={`sign-upload-${tenantId}`}
                className="sr-only"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading}
            />
            <label
                htmlFor={`sign-upload-${tenantId}`}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 ${
                    loading ? 'pointer-events-none opacity-60' : ''
                }`}
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                ) : (
                    <PenLine size={16} className="text-slate-400" />
                )}
                {loading ? 'Envoi en cours…' : 'Envoyer à signer'}
            </label>
        </>
    )
}
