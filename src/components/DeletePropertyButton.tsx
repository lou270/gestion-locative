'use client';

import { deleteProperty } from '@/app/actions/tenant';

export function DeletePropertyButton({ propertyId }: { propertyId: string }) {
    const handleDelete = async () => {
        if (!confirm("Voulez-vous vraiment supprimer ce bien ? Cette action est irréversible.")) return;

        try {
            await deleteProperty(propertyId);
        } catch (e) {
            alert("Erreur lors de la suppression." + e);
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
            Supprimer
        </button>
    );
}
