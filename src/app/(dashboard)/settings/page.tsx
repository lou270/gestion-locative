
import { getLandlord } from "@/app/actions/landlord";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
    const landlord = await getLandlord();

    return (
        <div className="min-h-screen bg-slate-50 pb-10">

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
                    <p className="text-slate-500 mt-2">Gérez les informations de votre profil bailleur (utilisées sur les documents).</p>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <SettingsForm landlord={landlord} />
                </div>
            </main>
        </div>
    );
}
