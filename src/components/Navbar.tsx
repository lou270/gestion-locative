'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Building2, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/tenants', label: 'Locataires', icon: Users },
    { href: '/properties', label: 'Mes biens', icon: Building2 },
]

export function Navbar() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href)

    return (
        <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="transition-opacity hover:opacity-80">
                        <Logo />
                    </Link>

                    <div className="hidden gap-1 md:flex">
                        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                aria-current={isActive(href) ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive(href)
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                                )}
                            >
                                <Icon size={17} />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/tenants/new"
                        className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-colors hover:bg-indigo-700 sm:flex"
                    >
                        <Plus size={17} />
                        Nouveau locataire
                    </Link>

                    <Link
                        href="/settings"
                        title="Paramètres"
                        aria-label="Paramètres"
                        className={cn(
                            'hidden rounded-lg p-2 transition-colors md:block',
                            isActive('/settings')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
                        )}
                    >
                        <Settings size={19} />
                    </Link>

                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Se déconnecter"
                        aria-label="Se déconnecter"
                        className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 md:block"
                    >
                        <LogOut size={19} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setMenuOpen((value) => !value)}
                        aria-expanded={menuOpen}
                        aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
                    {/* Le menu se referme dès qu'on active un élément : pas
                        besoin d'un effet synchronisé sur le chemin courant. */}
                    <div className="flex flex-col gap-1" onClick={() => setMenuOpen(false)}>
                        {[...NAV_ITEMS, { href: '/settings', label: 'Paramètres', icon: Settings }].map(
                            ({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive(href)
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-700 hover:bg-slate-100',
                                    )}
                                >
                                    <Icon size={18} />
                                    {label}
                                </Link>
                            ),
                        )}

                        <Link
                            href="/tenants/new"
                            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
                        >
                            <Plus size={17} />
                            Nouveau locataire
                        </Link>

                        <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                        >
                            <LogOut size={18} />
                            Se déconnecter
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}
