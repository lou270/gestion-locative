import Link from 'next/link'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, initials } from '@/lib/format'
import type { TenantOverview } from '@/app/actions/tenant'
import { cn } from '@/lib/cn'

export function TenantCard({ tenant }: { tenant: TenantOverview }) {
    const overdue = tenant.balance < -0.01
    const credit = tenant.balance > 0.01

    return (
        <Link
            href={`/tenants/${tenant.id}`}
            className={cn(
                'group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm shadow-slate-200/40 transition-all hover:shadow-md',
                tenant.active
                    ? 'border-slate-200/70 hover:border-indigo-200'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-300',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                            tenant.active
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-slate-200 text-slate-500',
                        )}
                    >
                        {initials(tenant.firstName, tenant.lastName)}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                            {tenant.firstName} {tenant.lastName}
                        </p>
                        <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                            {tenant.propertyName ? (
                                <Building2 size={12} className="shrink-0" />
                            ) : (
                                <MapPin size={12} className="shrink-0" />
                            )}
                            {tenant.propertyName ?? tenant.city}
                        </p>
                    </div>
                </div>

                <div className="shrink-0 text-right">
                    <p className="font-semibold text-slate-900">
                        {formatCurrency(tenant.monthlyTotal)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">par mois</p>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {!tenant.active ? (
                    <Badge tone="neutral">Bail terminé le {formatDate(tenant.endDate)}</Badge>
                ) : overdue ? (
                    <Badge tone="danger">Impayé {formatCurrency(Math.abs(tenant.balance))}</Badge>
                ) : credit ? (
                    <Badge tone="info">Avance {formatCurrency(tenant.balance)}</Badge>
                ) : (
                    <Badge tone="success">À jour</Badge>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Entrée le {formatDate(tenant.startDate)}</span>
                <span className="flex items-center gap-1 font-medium text-indigo-600">
                    Gérer
                    <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                    />
                </span>
            </div>
        </Link>
    )
}
