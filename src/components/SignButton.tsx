
'use client';

import { useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignButton({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm(`Voulez-vous envoyer "${file.name}" pour signature à ce locataire ?`)) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('tenantId', tenantId);
        formData.append('file', file);

        try {
            const res = await fetch('/api/signatures', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const error = await res.text();
                alert('Erreur: ' + error);
            } else {
                alert('Demande de signature envoyée avec succès !');
                router.refresh(); // Refresh to show new status
            }
        } catch (err: any) {
            alert('Erreur: ' + err.message);
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="inline-block">
            <input
                type="file"
                id={`sign-upload-${tenantId}`}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
            />
            <label
                htmlFor={`sign-upload-${tenantId}`}
                className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md flex items-center gap-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <span className="text-xl">✍️</span>
                )}
                {loading ? 'Envoi...' : 'Demander signature'}
            </label>
        </div>
    );
}
