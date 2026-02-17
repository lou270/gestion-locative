
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { LogOut, Settings, Building2, Users, Plus } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: '/', label: 'Tableau de bord', icon: Users },
        { href: '/properties', label: 'Mes Biens', icon: Building2 },
    ];

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo & Main Nav */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="hover:opacity-80 transition-opacity">
                            <Logo />
                        </Link>

                        <div className="hidden md:flex gap-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                            ${active
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        `}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/tenants/new"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/50"
                        >
                            <Plus size={18} />
                            <span>Nouveau Locataire</span>
                        </Link>

                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                        <Link
                            href="/settings"
                            className={`
                                p-2 rounded-full transition-all
                                ${isActive('/settings')
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}
                            `}
                            title="Paramètres"
                        >
                            <Settings size={20} />
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Se déconnecter"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile Nav (Simple fallback) */}
                <div className="md:hidden flex gap-4 py-2 border-t border-slate-50 overflow-x-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-slate-600 whitespace-nowrap"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
