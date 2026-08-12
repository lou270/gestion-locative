import Link from 'next/link'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'indigo' | 'emerald' | 'rose' | 'amber'

const ICON_TONES: Record<Tone, string> = {
    neutral: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
}

const VALUE_TONES: Record<Tone, string> = {
    neutral: 'text-slate-900',
    indigo: 'text-slate-900',
    emerald: 'text-emerald-700',
    rose: 'text-rose-600',
    amber: 'text-amber-700',
}

export function StatCard({
    label,
    value,
    hint,
    icon,
    tone = 'neutral',
    href,
}: {
    label: string
    value: React.ReactNode
    hint?: React.ReactNode
    icon?: React.ReactNode
    tone?: Tone
    href?: string
}) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                {icon && (
                    <span
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            ICON_TONES[tone],
                        )}
                    >
                        {icon}
                    </span>
                )}
            </div>
            <p className={cn('mt-3 text-2xl font-bold tracking-tight', VALUE_TONES[tone])}>
                {value}
            </p>
            {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
        </>
    )

    const className = cn(
        'block rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-200/40',
        href && 'transition-shadow hover:shadow-md hover:border-indigo-200',
    )

    return href ? (
        <Link href={href} className={className}>
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    )
}
