import { getProperties } from '@/app/actions/property'
import { PropertyForm } from '@/components/PropertyForm'
import { DeletePropertyButton } from '@/components/DeletePropertyButton' // Nouveau
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
    const result = await getProperties()
    const properties = result.success ? result.data : []

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mes Biens</h1>
                        <p className="text-gray-600">Gérez votre parc immobilier.</p>
                    </div>
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                        ← Retour au Tableau de Bord
                    </Link>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <PropertyForm />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Liste des Biens ({properties?.length || 0})</h2>
                        <div className="space-y-4">
                            {properties?.map((property: any) => (
                                <div key={property.id} className="border-b pb-4 last:border-0 relative group">
                                    <div className="flex justify-between items-start">
                                        <Link href={`/properties/${property.id}`} className="flex-1 hover:opacity-75 transition-opacity">
                                            <div>
                                                <div className="font-bold text-lg text-indigo-900">{property.name}</div>
                                                <div className="text-sm text-gray-600">{property.type}</div>
                                            </div>
                                        </Link>
                                        {property.tenants.length === 0 && (
                                            <DeletePropertyButton propertyId={property.id} />
                                        )}
                                    </div>
                                    <Link href={`/properties/${property.id}`} className="block hover:opacity-75 transition-opacity">
                                        <div className="text-sm text-gray-500 mt-1">{property.address}, {property.postalCode} {property.city}</div>
                                        <div className="text-xs bg-gray-100 inline-block px-2 py-1 rounded mt-2">
                                            {property._count?.tenants || 0} locataire(s) lié(s) • Voir le détail →
                                        </div>
                                    </Link>
                                </div>
                            ))}
                            {(!properties || properties.length === 0) && (
                                <p className="text-gray-400">Aucun bien enregistré.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
