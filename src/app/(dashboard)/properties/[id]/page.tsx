
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, Euro, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const property = await prisma.property.findUnique({
        where: { id },
        include: {
            tenants: {
                orderBy: { startDate: 'desc' }
            }
        }
    });

    if (!property) {
        notFound();
    }

    const now = new Date();

    // Categorize tenants
    const currentTenants = property.tenants.filter(t => !t.endDate || t.endDate >= now);
    const pastTenants = property.tenants.filter(t => t.endDate && t.endDate < now);

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    function formatDate(date: Date) {
        return format(new Date(date), 'd MMMM yyyy', { locale: fr });
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <Link href="/properties" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Retour aux biens
            </Link>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            {property.address}, {property.postalCode} {property.city}
                        </p>
                        <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            {property.type}
                        </span>
                    </div>
                    {/* Actions button could go here */}
                </div>
            </div>

            {/* Current Tenant Section */}
            <div className="mb-10">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <User className="text-indigo-600" size={20} />
                    Locataire Actuel
                </h2>

                {currentTenants.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {currentTenants.map(tenant => (
                            <Link
                                key={tenant.id}
                                href={`/tenants/${tenant.id}`}
                                className="group block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-50 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                                        {tenant.firstName[0]}{tenant.lastName[0]}
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                        En cours
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {tenant.firstName} {tenant.lastName}
                                </h3>
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Calendar size={14} className="mr-2 opacity-70" />
                                        Depuis le {formatDate(tenant.startDate)}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Euro size={14} className="mr-2 opacity-70" />
                                        {formatCurrency(tenant.rentAmount + tenant.chargeAmount)} / mois
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-8 text-center">
                        <p className="text-slate-500 mb-4">Aucun locataire n'occupe ce bien actuellement.</p>
                        <Link href={`/tenants/new?propertyId=${property.id}`} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            + Ajouter un locataire
                        </Link>
                    </div>
                )}
            </div>

            {/* Past Tenants Section */}
            {pastTenants.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="text-slate-400" size={20} />
                        Historique
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Locataire</th>
                                    <th className="px-6 py-3">Entrée</th>
                                    <th className="px-6 py-3">Sortie</th>
                                    <th className="px-6 py-3 text-right">Loyer Final</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastTenants.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {tenant.firstName} {tenant.lastName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatDate(tenant.startDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.endDate ? formatDate(tenant.endDate) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatCurrency(tenant.rentAmount + tenant.chargeAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/tenants/${tenant.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                                                Voir
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
