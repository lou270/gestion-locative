import { getLandlord } from '@/app/actions/landlord'
import { SettingsForm } from '@/components/SettingsForm'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata = { title: 'Paramètres · Gestion Locative' }

export default async function SettingsPage() {
    const result = await getLandlord()

    if (!result.success) {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeader title="Paramètres" />
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {result.error}
                </p>
            </div>
        )
    }

    const landlord = result.data

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Paramètres"
                description="Profil bailleur utilisé sur les quittances, avis d'échéance et baux."
            />

            {!landlord && (
                <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Renseignez votre profil : sans lui, les documents générés portent la mention
                    générique « Agence / Propriétaire ».
                </p>
            )}

            <Card>
                <SettingsForm landlord={landlord} />
            </Card>
        </div>
    )
}
