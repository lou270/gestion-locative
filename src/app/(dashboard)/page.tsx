

// TenantList affiche tout. Mieux vaut récupérer les données ici et afficher deux listes.
// Mais TenantList fait son propre fetch... C'est pas idéal.
// Je vais lire TenantList pour voir comment il est fait.
// S'il est 'use client', je dois faire le fetch ici.
// Apparemment, TenantList est importé. Regardons le fichier.

import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getFinancialStats } from '@/app/actions/finance';
import { RevenueChart } from '@/components/RevenueChart';

// Fonction de récupération des données (Server Component)
async function getTenants() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: { property: true }
    });
    return tenants;
}

export default async function Home() {
    const tenants = await getTenants();
    const statsResult = await getFinancialStats();
    const stats = statsResult.success && statsResult.data ? statsResult.data : null;

    const activeTenants = tenants.filter(t => !t.endDate || new Date(t.endDate) >= new Date());
    const inactiveTenants = tenants.filter(t => t.endDate && new Date(t.endDate) < new Date());

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Navbar simplifiée intégrée ou importée ? Navbar est dans components */}


            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                {/* Dashboard Financier */}
                {stats && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* KPI Cards */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Revenus Annuels ({new Date().getFullYear()})</h3>
                                <div className="text-3xl font-bold text-slate-900 mt-2">{stats.totalYearly.toFixed(2)} €</div>
                            </div>
                            <div className="mt-4 text-emerald-600 text-sm font-medium flex items-center gap-1">
                                <span>↗</span> C'est en hausse
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">Taux d'Occupation</h3>
                                <div className="text-3xl font-bold text-slate-900 mt-2">{stats.occupancyRate}%</div>
                            </div>
                            <div className="mt-4 text-slate-400 text-sm">
                                {stats.rentedPropertiesCount} bien(s) loué(s) sur {stats.totalProperties}
                            </div>
                        </div>

                        <Link href="/properties" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl mb-3">
                                🏠
                            </div>
                            <div className="font-medium text-slate-900">Total Biens</div>
                            <div className="text-2xl font-bold text-indigo-600">{stats.totalProperties}</div>
                        </Link>

                        {/* Graphique */}
                        <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-slate-900 font-bold mb-6">Évolution des revenus</h3>
                            <RevenueChart data={stats.chartData} />
                        </div>
                    </section>
                )}

                {/* Section Locataires Actifs */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Locataires Actifs
                        </h2>
                        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                            {activeTenants.length} dossiers
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTenants.map((tenant) => (
                            <Link href={`/tenants/${tenant.id}`} key={tenant.id} className="group">
                                <article className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {tenant.firstName[0]}{tenant.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                    {tenant.firstName} {tenant.lastName}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                                    {tenant.property ? tenant.property.name : tenant.city}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">{tenant.rentAmount + tenant.chargeAmount} €</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">/ mois</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500">
                                        <span>Entrée le {new Date(tenant.startDate).toLocaleDateString('fr-FR')}</span>
                                        <span className="text-indigo-600 font-medium group-hover:translate-x-1 transition-transform">Gérer →</span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                        {activeTenants.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                                Aucun locataire actif.
                            </div>
                        )}
                    </div>
                </section>

                {/* Section Locataires Terminés (si existants) */}
                {inactiveTenants.length > 0 && (
                    <section className="pt-8 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                Baux Terminés
                            </h2>
                            <span className="text-sm text-slate-400">
                                {inactiveTenants.length} archives
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                            {inactiveTenants.map((tenant) => (
                                <Link href={`/tenants/${tenant.id}`} key={tenant.id} className="group">
                                    <article className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-all h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm grayscale">
                                                    {tenant.firstName[0]}{tenant.lastName[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-600">
                                                        {tenant.firstName} {tenant.lastName}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Fin le {tenant.endDate ? new Date(tenant.endDate).toLocaleDateString('fr-FR') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}
