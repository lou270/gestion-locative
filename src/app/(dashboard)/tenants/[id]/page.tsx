import { getTenant } from '@/app/actions/tenant'
import { recordPayment } from '@/app/actions/tenant'
import Link from 'next/link'
import { PaymentForm } from '@/components/PaymentForm'
import { DeletePaymentButton } from '@/components/DeletePaymentButton'
import { TerminateLeaseButton } from '@/components/TerminateLeaseButton'
import { SignButton } from '@/components/SignButton'
import { SignatureList } from '@/components/SignatureList'
import { LeaseActions } from '@/components/LeaseActions'
import { EditTenantModal } from '@/components/EditTenantModal'
import { RentRevisionButton } from '@/components/RentRevisionButton'
import { getProperties } from '@/app/actions/property'
import { calculateProrata, calculateTotalDueUntilDate } from '@/lib/calculations'

const getMonthStatus = (tenant: any, monthDate: Date) => {
    const startDate = new Date(tenant.startDate);
    const endDate = tenant.endDate ? new Date(tenant.endDate) : null;
    const totalDue = calculateProrata(tenant.rentAmount, tenant.chargeAmount, monthDate, startDate, endDate);

    // Si rien n'est dû (avant entrée ou après sortie), on ne retourne rien
    if (totalDue === 0) return null;

    // Trouver les paiements pour ce mois
    const payments = tenant.payments.filter((p: any) => {
        const pDate = new Date(p.periodStart);
        return pDate.getMonth() === monthDate.getMonth() && pDate.getFullYear() === monthDate.getFullYear();
    });

    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Statut : Si totalPaid >= totalDue (même si 0), c'est payé. 
    // Attention au cas où totalDue est 0 (mois partiel très court ou bug), considérons payé.
    let status = 'Unpaid';
    if (totalPaid >= totalDue - 0.01) status = 'Paid'; // Petite marge d'erreur float
    else if (totalPaid > 0) status = 'Partial';

    return {
        date: monthDate,
        totalDue,
        totalPaid,
        status,
        payments
    };
};

export default async function TenantPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const result = await getTenant(params.id)

    if (!result.success || !result.data) {
        return <div>Locataire non trouvé</div>
    }

    const tenant = result.data

    // Récupérer les biens pour l'édition
    const propertiesResult = await getProperties();
    const properties = propertiesResult.success && propertiesResult.data ? propertiesResult.data : [];

    const startDate = new Date(tenant.startDate);
    const now = new Date();

    // Calcul du solde global
    const totalDue = calculateTotalDueUntilDate(
        tenant.rentAmount,
        tenant.chargeAmount,
        startDate,
        now,
        tenant.endDate ? new Date(tenant.endDate) : null
    );

    // Séparer les dépôts de garantie des autres paiements
    const normalPayments = tenant.payments.filter((p: any) => p.typology !== 'Depot');
    const depositPayments = tenant.payments.filter((p: any) => p.typology === 'Depot');

    const totalPaid = normalPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const depositAmount = depositPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    const balance = totalPaid - totalDue;

    // Générer l'historique depuis la date d'entrée jusqu'à le mois prochain
    // On va générer mois par mois de NOW + 1 mois jusqu'à STARTDATE
    const targetEnd = new Date();
    targetEnd.setMonth(targetEnd.getMonth() + 1);

    const monthsDiff = (targetEnd.getFullYear() - startDate.getFullYear()) * 12 + (targetEnd.getMonth() - startDate.getMonth());
    // On assure au moins 1 mois affiché
    const numberOfMonths = Math.max(monthsDiff + 1, 1);

    const history = Array.from({ length: numberOfMonths }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1 - i); // Commence au mois prochain et recule
        return getMonthStatus(tenant, d);
    }).filter(Boolean); // Enlever les mois nuls (avant entrée ou après sortie)

    return (
        <main className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Navigation */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Link href="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Dossier Locataire</span>
                </div>

                {/* Header Locataire */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-indigo-700 border border-indigo-50">
                            {tenant.firstName[0]}{tenant.lastName[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{tenant.firstName} {tenant.lastName}</h1>
                                <EditTenantModal tenant={tenant} properties={properties} />
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                <span>{tenant.property ? '🏠 ' + tenant.property.name : '📍 ' + tenant.city}</span>
                                <span className="text-gray-300">|</span>
                                <span>Entrée le {new Date(tenant.startDate).toLocaleDateString('fr-FR')}</span>
                                {tenant.endDate && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-red-500">Sortie le {new Date(tenant.endDate).toLocaleDateString('fr-FR')}</span>
                                    </>
                                )}
                            </div>
                            <div className="mt-2 text-sm">
                                <LeaseActions>
                                    <h3 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</h3>
                                    <a href={`/api/lease/${tenant.id}`} target="_blank" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md flex items-center gap-2">
                                        📜 Générer PDF
                                    </a>

                                    <div className="w-full border-t border-gray-100 my-1"></div>
                                    <h3 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h3>

                                    <div className="w-full px-2 py-1">
                                        <SignButton tenantId={tenant.id} />
                                    </div>
                                    <div className="w-full px-2 py-1">
                                        <TerminateLeaseButton tenantId={tenant.id} existingEndDate={tenant.endDate ? new Date(tenant.endDate).toISOString() : null} />
                                    </div>
                                </LeaseActions>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 bg-gray-50 px-6 py-3 rounded-xl border border-gray-100">
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex justify-between">
                                Loyer
                                <RentRevisionButton tenantId={tenant.id} currentRent={tenant.rentAmount} />
                            </div>
                            <div className="font-bold text-gray-900">{tenant.rentAmount} €</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Charges</div>
                            <div className="font-bold text-gray-900">{tenant.chargeAmount} €</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</div>
                            <div className="font-bold text-indigo-600 text-lg">{tenant.rentAmount + tenant.chargeAmount} €</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dépôt Garantie</div>
                            <div className="font-bold text-gray-900">{depositAmount > 0 ? depositAmount + ' €' : '-'}</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Solde à ce jour</div>
                            <div className={`font-bold text-lg ${balance < -1 ? 'text-red-500' : balance > 1 ? 'text-emerald-500' : 'text-gray-900'}`}>
                                {balance > 0 ? '+' : ''}{balance.toFixed(2)} €
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* Colonne Gauche : Historique */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Historique des Paiements</h2>
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium border border-indigo-100">
                                    {history.length} mois
                                </span>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {history.map((item: any, idx) => (
                                    <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className={`mt-1 w-2.5 h-2.5 rounded-full ${item.status === 'Paid' ? 'bg-emerald-400' :
                                                    item.status === 'Partial' ? 'bg-amber-400' : 'bg-rose-400'
                                                    }`}></div>

                                                <div>
                                                    <div className="font-bold text-gray-900 capitalize text-lg">
                                                        {item.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                    </div>

                                                    <div className="text-sm mt-1 flex items-center gap-3">
                                                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            item.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-rose-50 text-rose-700 border-rose-100'
                                                            }`}>
                                                            {item.status === 'Paid' ? 'Reglé' : item.status === 'Partial' ? 'Partiel' : 'Impayé'}
                                                        </span>
                                                        <span className="text-gray-400 relative top-px">
                                                            Reçu : <span className="font-medium text-gray-700">{item.totalPaid.toFixed(2)}€</span> / {item.totalDue.toFixed(2)}€
                                                        </span>
                                                    </div>

                                                    {/* Liste des paiements individuels */}
                                                    {item.payments.length > 0 && (
                                                        <div className="mt-3 flex flex-col gap-2">
                                                            {item.payments.map((p: any) => (
                                                                <div key={p.id} className="inline-flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-600 shadow-sm w-fit">
                                                                    <span>🗓️ {new Date(p.date).toLocaleDateString('fr-FR')}</span>
                                                                    <span className="font-medium text-gray-900">{p.amount.toFixed(2)}€</span>
                                                                    <span className="text-gray-400 italic">({p.typology})</span>
                                                                    <div className="border-l border-gray-200 pl-2 ml-1">
                                                                        <DeletePaymentButton paymentId={p.id} tenantId={tenant.id} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <a href={`/api/notice/${tenant.id}?month=${item.date.getMonth() + 1}&year=${item.date.getFullYear()}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                    title="Avis d'échéance"
                                                >
                                                    📄
                                                </a>

                                                {item.status === 'Paid' && (
                                                    <a href={`/api/receipt/${tenant.id}?month=${item.date.getMonth() + 1}&year=${item.date.getFullYear()}`}
                                                        target="_blank"
                                                        className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                                        title="Quittance"
                                                    >
                                                        ✅
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Journal des Paiements */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900">Journal des Paiements</h2>
                                <p className="text-sm text-gray-500">Liste exhaustive de tous les encaissements reçus.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Période</th>
                                            <th className="px-6 py-3 text-right">Montant</th>
                                            <th className="px-6 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tenant.payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Aucun paiement enregistré</td>
                                            </tr>
                                        ) : (
                                            tenant.payments.map((payment: any) => (
                                                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-900">
                                                        {new Date(payment.date).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${payment.typology === 'Loyer' ? 'bg-indigo-50 text-indigo-700' :
                                                            payment.typology === 'Depot' ? 'bg-amber-50 text-amber-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {payment.typology}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {new Date(payment.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                        {payment.amount.toFixed(2)} €
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <DeletePaymentButton paymentId={payment.id} tenantId={tenant.id} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Colonne Droite : Formulaire Sticky */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>💰</span> Nouveau Paiement
                            </h2>
                            <PaymentForm tenantId={tenant.id} />

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Coordonnées</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg">📞</span>
                                        {tenant.phone || 'Non renseigné'}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg">✉️</span>
                                        {tenant.email || 'Non renseigné'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <SignatureList signatureRequests={tenant.signatureRequests || []} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}
