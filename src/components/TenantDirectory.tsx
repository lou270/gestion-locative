'use client'

import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { TenantCard } from '@/components/TenantCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'
import type { TenantOverview } from '@/app/actions/tenant'
import { cn } from '@/lib/cn'

type Filter = 'active' | 'ended' | 'all'

const FILTERS: { value: Filter; label: string }[] = [
    { value: 'active', label: 'En cours' },
    { value: 'ended', label: 'Terminés' },
    { value: 'all', label: 'Tous' },
]

/** Annuaire des locataires avec recherche et filtre par état du bail. */
export function TenantDirectory({ tenants }: { tenants: TenantOverview[] }) {
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState<Filter>('active')

    const counts = useMemo(
        () => ({
            active: tenants.filter((t) => t.active).length,
            ended: tenants.filter((t) => !t.active).length,
            all: tenants.length,
        }),
        [tenants],
    )

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase()
        return tenants.filter((tenant) => {
            if (filter === 'active' && !tenant.active) return false
            if (filter === 'ended' && tenant.active) return false
            if (!needle) return true

            return [tenant.firstName, tenant.lastName, tenant.propertyName, tenant.city]
                .filter(Boolean)
                .some((value) => (value as string).toLowerCase().includes(needle))
        })
    }, [tenants, query, filter])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative sm:max-w-xs sm:flex-1">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Rechercher un locataire, un bien…"
                        aria-label="Rechercher un locataire"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    />
                </div>

                <div
                    className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
                    role="tablist"
                >
                    {FILTERS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={filter === option.value}
                            onClick={() => setFilter(option.value)}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                filter === option.value
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-500 hover:text-slate-900',
                            )}
                        >
                            {option.label}
                            <span className="ml-1.5 text-xs text-slate-400">
                                {counts[option.value]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {results.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((tenant) => (
                        <TenantCard key={tenant.id} tenant={tenant} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Users size={20} />}
                    title={query ? 'Aucun résultat' : 'Aucun locataire dans cette vue'}
                    description={
                        query
                            ? 'Essayez avec un autre nom, une ville ou le nom d’un bien.'
                            : 'Créez une fiche locataire pour suivre ses loyers et éditer ses quittances.'
                    }
                    action={
                        !query && <ButtonLink href="/tenants/new">Ajouter un locataire</ButtonLink>
                    }
                />
            )}
        </div>
    )
}
