'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600 shadow-sm shadow-indigo-500/20',
    secondary:
        'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 shadow-sm shadow-rose-500/20',
    success:
        'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600 shadow-sm shadow-emerald-500/20',
}

const SIZES: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

const BASE =
    'inline-flex items-center justify-center font-semibold transition-colors ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap'

interface CommonProps {
    variant?: Variant
    size?: Size
    loading?: boolean
    className?: string
    children?: React.ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {children}
        </button>
    )
}

export function ButtonLink({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}: CommonProps & React.ComponentProps<typeof Link>) {
    return (
        <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
            {children}
        </Link>
    )
}
