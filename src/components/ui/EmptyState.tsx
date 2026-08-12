import { cn } from '@/lib/cn'

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center',
                className,
            )}
        >
            {icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 border border-slate-200">
                    {icon}
                </div>
            )}
            <p className="font-medium text-slate-700">{title}</p>
            {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    )
}
