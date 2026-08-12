'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

/**
 * Génération de l'attestation de loyer CAF (Cerfa 10842*07).
 *
 * Le formulaire envoyé par la CAF est nominatif (matricule et code-barres
 * pré-imprimés) : il est téléversé à chaque demande plutôt que stocké comme
 * modèle. Les valeurs proposées viennent du dossier locataire et restent
 * modifiables — plusieurs rubriques du Cerfa relèvent d'une déclaration sur
 * l'honneur du bailleur.
 */

type Values = Record<string, string>

function TriState({
    label,
    name,
    values,
    onChange,
    hint,
}: {
    label: string
    name: string
    values: Values
    onChange: (name: string, value: string) => void
    hint?: string
}) {
    return (
        <SelectField
            label={label}
            hint={hint}
            value={values[name] ?? ''}
            onChange={(event) => onChange(name, event.target.value)}
        >
            <option value="">Ne pas répondre</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
        </SelectField>
    )
}

export function CafAttestationModal({
    open,
    onClose,
    tenantId,
    tenantName,
    loadPrefill,
}: {
    open: boolean
    onClose: () => void
    tenantId: string
    tenantName: string
    loadPrefill: () => Promise<{ success: true; data: Values } | { success: false; error: string }>
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [values, setValues] = useState<Values | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const toast = useToast()

    const set = (name: string, value: string) =>
        setValues((current) => ({ ...(current ?? {}), [name]: value }))

    // `requested` est un ref et non un état : le placer dans les dépendances de
    // l'effet le relancerait, et son nettoyage annulerait sa propre requête.
    const requested = useRef(false)
    const mounted = useRef(true)
    useEffect(
        () => () => {
            mounted.current = false
        },
        [],
    )

    /**
     * Charge les valeurs proposées. Toute erreur est affichée dans la modale
     * avec un bouton de reprise : sans `catch`, une promesse rejetée laissait
     * l'écran bloqué sur « Préparation… » indéfiniment.
     */
    const fetchPrefill = useCallback(async () => {
        requested.current = true
        setLoading(true)
        setError(null)

        try {
            const result = await loadPrefill()
            if (!mounted.current) return

            if (result.success) setValues(result.data)
            else setError(result.error)
        } catch (cause) {
            console.error('Chargement du pré-remplissage CAF :', cause)
            if (mounted.current) {
                setError(
                    'Les informations du locataire n’ont pas pu être chargées. ' +
                        'Vérifiez votre connexion, puis réessayez.',
                )
            }
        } finally {
            if (mounted.current) setLoading(false)
        }
    }, [loadPrefill])

    // Le pré-remplissage n'est demandé qu'à la première ouverture, puis
    // conservé : l'utilisateur retrouve ses ajustements s'il rouvre la modale.
    useEffect(() => {
        if (!open || requested.current) return
        void fetchPrefill()
    }, [open, fetchPrefill])

    const retry = () => {
        requested.current = false
        void fetchPrefill()
    }

    const close = () => {
        onClose()
        setFileName(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const generate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!values) return

        const file = fileRef.current?.files?.[0]
        if (!file) {
            toast.error('Téléversez d’abord le formulaire reçu de la CAF.')
            return
        }

        setGenerating(true)
        try {
            const payload = new FormData()
            payload.append('file', file)
            Object.entries(values).forEach(([key, value]) => payload.append(key, value))

            const response = await fetch(`/api/caf/${tenantId}`, {
                method: 'POST',
                body: payload,
            })

            if (!response.ok) {
                const body = await response.json().catch(() => null)
                toast.error(body?.error ?? 'La génération a échoué.')
                return
            }

            // Téléchargement immédiat : le document n'est pas conservé côté serveur.
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `attestation-loyer-caf-${tenantName.replace(/\s+/g, '-')}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)

            toast.success('Attestation générée.')
            close()
        } catch {
            toast.error('Impossible de contacter le serveur.')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Modal
                open={open}
                onClose={close}
                title="Attestation de loyer CAF"
                description="Cerfa 10842*07 — le formulaire reçu de la CAF est rempli puis téléchargé."
                className="max-w-3xl"
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        Préparation des informations…
                    </div>
                ) : !values ? (
                    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <AlertTriangle size={20} />
                        </span>
                        <p className="max-w-sm text-sm text-slate-600">
                            {error ?? 'Les informations du locataire n’ont pas pu être chargées.'}
                        </p>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={close}>
                                Fermer
                            </Button>
                            <Button onClick={retry}>Réessayer</Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={generate} className="max-h-[70vh] overflow-y-auto px-6 py-5">
                        <div className="space-y-6">
                            {/* Téléversement */}
                            <section>
                                <label
                                    htmlFor="caf-file"
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                                >
                                    <Upload size={22} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">
                                        {fileName ?? 'Téléverser le formulaire CAF (PDF)'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Le document est nominatif : utilisez celui reçu pour ce
                                        locataire.
                                    </span>
                                </label>
                                <input
                                    ref={fileRef}
                                    id="caf-file"
                                    type="file"
                                    accept="application/pdf"
                                    className="sr-only"
                                    onChange={(event) =>
                                        setFileName(event.target.files?.[0]?.name ?? null)
                                    }
                                />
                            </section>

                            <p className="flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-900">
                                <Info size={15} className="mt-0.5 shrink-0" />
                                <span>
                                    Seule la première page est remplie. Vérifiez les montants : le
                                    Cerfa demande un loyer pour un <strong>mois complet</strong>,
                                    au tarif applicable à la période concernée. Une rubrique laissée
                                    vide reste vierge sur le document.
                                </span>
                            </p>

                            {/* Bailleur */}
                            <Section title="Bailleur">
                                <TextField
                                    label="Nom ou raison sociale"
                                    value={values.landlordName ?? ''}
                                    onChange={(e) => set('landlordName', e.target.value)}
                                />
                                <TextField
                                    label="Adresse"
                                    value={values.landlordAddress ?? ''}
                                    onChange={(e) => set('landlordAddress', e.target.value)}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField
                                        label="Téléphone"
                                        value={values.landlordPhone ?? ''}
                                        onChange={(e) => set('landlordPhone', e.target.value)}
                                    />
                                    <TextField
                                        label="Fax"
                                        value={values.landlordFax ?? ''}
                                        onChange={(e) => set('landlordFax', e.target.value)}
                                    />
                                    <TextField
                                        label="Adresse mél"
                                        value={values.landlordEmail ?? ''}
                                        onChange={(e) => set('landlordEmail', e.target.value)}
                                    />
                                    <TextField
                                        label="SIRET"
                                        value={values.landlordSiret ?? ''}
                                        onChange={(e) => set('landlordSiret', e.target.value)}
                                    />
                                </div>
                            </Section>

                            {/* Locataires et logement */}
                            <Section title="Locataires et logement">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField
                                        label="Locataire 1"
                                        value={values.tenant1 ?? ''}
                                        onChange={(e) => set('tenant1', e.target.value)}
                                    />
                                    <TextField
                                        label="Locataire 2"
                                        value={values.tenant2 ?? ''}
                                        onChange={(e) => set('tenant2', e.target.value)}
                                    />
                                </div>
                                <TextField
                                    label="Locataire(s) en titre depuis le"
                                    type="date"
                                    value={values.startDate ?? ''}
                                    onChange={(e) => set('startDate', e.target.value)}
                                />
                                <TextField
                                    label="Adresse complète du logement"
                                    value={values.housingAddress ?? ''}
                                    onChange={(e) => set('housingAddress', e.target.value)}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField
                                        label="Surface réelle"
                                        suffix="m²"
                                        value={values.surface ?? ''}
                                        onChange={(e) => set('surface', e.target.value)}
                                    />
                                    <TriState
                                        label="Chambre (pièce unique sans WC)"
                                        name="singleRoom"
                                        values={values}
                                        onChange={set}
                                    />
                                    <TriState
                                        label="Colocation"
                                        name="coTenancy"
                                        values={values}
                                        onChange={set}
                                    />
                                    <TextField
                                        label="Nombre de colocataires"
                                        value={values.coTenantsCount ?? ''}
                                        onChange={(e) => set('coTenantsCount', e.target.value)}
                                        hint="Demandeur inclus."
                                    />
                                </div>
                                <SelectField
                                    label="Logement meublé"
                                    value={values.furnished ?? 'non'}
                                    onChange={(e) => set('furnished', e.target.value)}
                                    hint="Si meublé, le loyer est déclaré charges comprises."
                                >
                                    <option value="non">Non</option>
                                    <option value="oui">Oui</option>
                                </SelectField>
                            </Section>

                            {/* Loyers */}
                            <Section title="Montant mensuel du loyer">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <TextField
                                        label="Mois d'entrée dans les lieux"
                                        value={values.entryMonthLabel ?? ''}
                                        onChange={(e) => set('entryMonthLabel', e.target.value)}
                                    />
                                    <TextField
                                        label="Loyer hors charges"
                                        suffix="€"
                                        value={values.entryRent ?? ''}
                                        onChange={(e) => set('entryRent', e.target.value)}
                                    />
                                    <TextField
                                        label="Charges"
                                        suffix="€"
                                        value={values.entryCharges ?? ''}
                                        onChange={(e) => set('entryCharges', e.target.value)}
                                    />
                                </div>
                                <TextField
                                    label="Total en cas de colocation"
                                    suffix="€"
                                    value={values.coTenancyTotal ?? ''}
                                    onChange={(e) => set('coTenancyTotal', e.target.value)}
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <TextField
                                        label="Mois de juillet — année"
                                        value={values.julyYear ?? ''}
                                        onChange={(e) => set('julyYear', e.target.value)}
                                    />
                                    <TextField
                                        label="Loyer hors charges"
                                        suffix="€"
                                        value={values.julyRent ?? ''}
                                        onChange={(e) => set('julyRent', e.target.value)}
                                    />
                                    <TextField
                                        label="Charges"
                                        suffix="€"
                                        value={values.julyCharges ?? ''}
                                        onChange={(e) => set('julyCharges', e.target.value)}
                                    />
                                </div>
                            </Section>

                            {/* Déclarations */}
                            <Section title="Déclarations du bailleur">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TriState
                                        label="Locataire à jour de ses loyers"
                                        name="upToDate"
                                        values={values}
                                        onChange={set}
                                    />
                                    <TextField
                                        label="Mois du dernier loyer acquitté"
                                        value={values.lastPaidMonth ?? ''}
                                        onChange={(e) => set('lastPaidMonth', e.target.value)}
                                        hint="Si le locataire n'est pas à jour."
                                    />
                                    <TriState
                                        label="Sous-location"
                                        name="sublet"
                                        values={values}
                                        onChange={set}
                                    />
                                    <TriState
                                        label="Hôtel ou pension de famille"
                                        name="hotel"
                                        values={values}
                                        onChange={set}
                                    />
                                    <TriState
                                        label="Recevoir l'aide directement"
                                        name="directPayment"
                                        values={values}
                                        onChange={set}
                                        hint="À remplir au premier dépôt uniquement."
                                    />
                                    <TriState
                                        label="Logement décent"
                                        name="decency"
                                        values={values}
                                        onChange={set}
                                    />
                                </div>
                            </Section>

                            {/* Signature */}
                            <Section title="Signature">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField
                                        label="Fait à"
                                        value={values.signaturePlace ?? ''}
                                        onChange={(e) => set('signaturePlace', e.target.value)}
                                    />
                                    <TextField
                                        label="Le"
                                        type="date"
                                        value={values.signatureDate ?? ''}
                                        onChange={(e) => set('signatureDate', e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    La signature et le cachet restent à apposer sur le document
                                    imprimé.
                                </p>
                            </Section>
                        </div>

                        <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 pt-4">
                            <Button type="button" variant="secondary" onClick={close}>
                                Annuler
                            </Button>
                            <Button type="submit" loading={generating} disabled={!fileName}>
                                Générer l’attestation
                            </Button>
                        </div>
                    </form>
            )}
        </Modal>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-900">
                {title}
            </h3>
            {children}
        </section>
    )
}
