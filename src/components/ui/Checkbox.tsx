'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

export function Checkbox({
    label,
    hint,
    className,
    ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    const id = useId()

    return (
        <div className={cn('flex items-start gap-2.5', className)}>
            <input
                id={id}
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 accent-indigo-600 focus:ring-2 focus:ring-indigo-500/30"
                {...props}
            />
            <label htmlFor={id} className="text-sm text-slate-700">
                {label}
                {hint && <span className="block text-xs text-slate-500">{hint}</span>}
            </label>
        </div>
    )
}
