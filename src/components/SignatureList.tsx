
'use client';

import { LucideFileSignature, CheckCircle, XCircle, Clock, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignatureRequest {
    id: string;
    status: string;
    createdAt: string | Date;
    externalId?: string | null;
}

interface SignatureListProps {
    signatureRequests: SignatureRequest[];
}

export function SignatureList({ signatureRequests }: SignatureListProps) {
    const router = useRouter();

    if (!signatureRequests || signatureRequests.length === 0) {
        return (
            <div className="text-sm text-gray-500 italic">
                Aucune demande de signature.
            </div>
        );
    }

    const checkStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/signatures/${id}`);
            if (res.ok) {
                const data = await res.json();
                alert(`Statut mis à jour : ${data.status}`);
                router.refresh();
            } else {
                alert('Erreur lors de la vérification du statut');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur réseau');
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <LucideFileSignature className="w-4 h-4" />
                Historique des signatures
            </h3>
            <ul className="space-y-2">
                {signatureRequests.map((req) => (
                    <li key={req.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">Bail de location</span>
                            <span className="text-xs text-gray-500">
                                {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={req.status} />
                            {(req.status === 'PENDING' || req.status === 'ongoing') && (
                                <button
                                    onClick={() => checkStatus(req.id)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                    title="Vérifier le statut"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                            )}
                            {(req.status === 'SIGNED' || req.status === 'done') && (
                                <a
                                    href={`/api/signatures/${req.id}/download`}
                                    target="_blank"
                                    className="p-1 hover:bg-green-50 text-green-600 rounded-full transition-colors"
                                    title="Télécharger le document signé"
                                >
                                    📥
                                </a>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toUpperCase();
    if (s === 'SIGNED' || s === 'DONE') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3" /> Signé
            </span>
        );
    }
    if (s === 'REJECTED' || s === 'REFUSED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <XCircle className="w-3 h-3" /> Refusé
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> En attente
        </span>
    );
}
