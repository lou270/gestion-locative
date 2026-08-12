import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Crumb {
    label: string
    href?: string
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    action,
    className,
}: {
    title: string
    description?: string
    breadcrumbs?: Crumb[]
    action?: React.ReactNode
    className?: string
}) {
    return (
        <header className={cn('mb-8', className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Fil d'Ariane" className="mb-3">
                    <ol className="flex items-center gap-1 text-sm text-slate-500">
                        {breadcrumbs.map((crumb, index) => (
                            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                                {index > 0 && (
                                    <ChevronRight size={14} className="text-slate-300" aria-hidden />
                                )}
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="hover:text-indigo-600 transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-slate-900 font-medium">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        {title}
                    </h1>
                    {description && <p className="text-slate-500 mt-1">{description}</p>}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </header>
    )
}
