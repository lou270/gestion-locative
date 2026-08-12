'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
    id: number
    tone: ToastTone
    message: string
}

interface ToastContextValue {
    toast: (message: string, tone?: ToastTone) => void
    success: (message: string) => void
    error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATION = 5000

/**
 * Remplace les `alert()` bloquants et les messages inline dispersés dans
 * chaque formulaire par un retour utilisateur unique et cohérent.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((t) => t.id !== id))
    }, [])

    const toast = useCallback((message: string, tone: ToastTone = 'info') => {
        setToasts((current) => [...current, { id: Date.now() + Math.random(), tone, message }])
    }, [])

    const value = useMemo<ToastContextValue>(
        () => ({
            toast,
            success: (message: string) => toast(message, 'success'),
            error: (message: string) => toast(message, 'error'),
        }),
        [toast],
    )

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
                role="region"
                aria-label="Notifications"
            >
                {toasts.map((item) => (
                    <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const TONE_STYLES: Record<ToastTone, { wrapper: string; icon: React.ReactNode }> = {
    success: {
        wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        icon: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden />,
    },
    error: {
        wrapper: 'border-rose-200 bg-rose-50 text-rose-900',
        icon: <AlertTriangle size={18} className="text-rose-600 shrink-0" aria-hidden />,
    },
    info: {
        wrapper: 'border-slate-200 bg-white text-slate-900',
        icon: <Info size={18} className="text-indigo-600 shrink-0" aria-hidden />,
    },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), DURATION)
        return () => clearTimeout(timer)
    }, [toast.id, onDismiss])

    const style = TONE_STYLES[toast.tone]

    return (
        <div
            role="status"
            aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
            className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-slate-900/5',
                'animate-[toast-in_180ms_ease-out]',
                style.wrapper,
            )}
        >
            {style.icon}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
                aria-label="Fermer la notification"
            >
                <X size={15} />
            </button>
        </div>
    )
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.')
    }
    return context
}
