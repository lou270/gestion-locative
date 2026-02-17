import Link from 'next/link';

interface TenantCardProps {
    tenant: any;
    historyMonths: { month: number; year: number; label: string }[];
}

export function TenantCard({ tenant, historyMonths }: TenantCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href={`/tenants/${tenant.id}`} className="font-bold text-lg text-gray-900 hover:text-indigo-600 transition-colors">
                            {tenant.firstName} {tenant.lastName}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            {tenant.property ? (
                                <>
                                    <span>🏠</span>
                                    <span className="font-medium text-gray-700">{tenant.property.name}</span>
                                </>
                            ) : (
                                <>
                                    <span>📍</span>
                                    <span>{tenant.address}, {tenant.city}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                        {tenant.rentAmount + tenant.chargeAmount} €
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1">
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Actions Rapides</p>
                    <div className="grid grid-cols-2 gap-2">
                        <a
                            href={`/api/receipt/${tenant.id}`}
                            target="_blank"
                            className="flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                            <span>📄</span> Quittance
                        </a>
                        <Link
                            href={`/tenants/${tenant.id}`}
                            className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-indigo-100"
                        >
                            <span>💰</span> Paiement
                        </Link>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Derniers mois</p>
                    <div className="flex flex-wrap gap-2">
                        {historyMonths.slice(1, 4).map((date) => (
                            <a
                                key={`${date.month}-${date.year}`}
                                href={`/api/receipt/${tenant.id}?month=${date.month}&year=${date.year}`}
                                target="_blank"
                                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded transition-colors hover:bg-white hover:border-indigo-200 hover:text-indigo-600"
                                title={`Quittance ${date.label}`}
                            >
                                {date.label.split(' ')[0].slice(0, 3)}.
                            </a>
                        ))}
                        <Link href={`/tenants/${tenant.id}`} className="text-xs text-indigo-500 hover:text-indigo-700 px-1 py-1">
                            +voir tout
                        </Link>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <Link href={`/tenants/${tenant.id}`} className="text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                    Voir le dossier complet →
                </Link>
            </div>
        </div>
    );
}
