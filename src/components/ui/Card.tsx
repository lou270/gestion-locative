import { cn } from '@/lib/cn'

export function Card({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'bg-white rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/40',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({
    className,
    title,
    description,
    action,
}: {
    className?: string
    title: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
}) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100',
                className,
            )}
        >
            <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn('px-6 py-5', className)}>{children}</div>
}
