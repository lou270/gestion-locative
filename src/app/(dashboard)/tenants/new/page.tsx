
import { TenantForm } from '@/components/TenantForm';
import { getProperties } from '@/app/actions/property'; // Assuming we need properties list

export default async function NewTenantPage() {
    const result = await getProperties();
    const properties = result.success && result.data ? result.data : [];

    return (
        <main className="min-h-screen bg-gray-50/50 p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouveau Locataire</h1>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <TenantForm properties={properties} />
                </div>
            </div>
        </main>
    );
}
