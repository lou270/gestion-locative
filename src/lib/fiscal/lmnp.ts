/**
 * Calcul fiscal LMNP (loueur en meublé non professionnel).
 *
 * Module pur : aucun accès base, aucun import Prisma, afin d'être testable
 * ligne à ligne. Les règles d'encaissement (dépôt de garantie exclu, CAF
 * incluse) sont celles de `ledger.ts`, seule source de vérité comptable.
 *
 * Le BIC est une comptabilité de caisse : on raisonne sur ce qui a été encaissé
 * et décaissé dans l'année civile, pas sur ce qui était dû.
 */

import { PAYMENT_TYPE_LABELS, isRentPayment, round, sumAmounts } from '../ledger'
import { expenseCategoryLabel } from '../expenses'

/* ══════════════════════════════════════════════════════════════════════════
 *  PARAMÈTRES FISCAUX — À REVÉRIFIER À CHAQUE LOI DE FINANCES
 *
 *  Ces valeurs changent presque tous les ans. Elles ne doivent JAMAIS être
 *  recopiées ailleurs : tout le reste du code lit ce bloc.
 *
 *  Sources à consulter :
 *    - art. 50-0 du CGI (régime micro-BIC : taux d'abattement et plafonds)
 *    - la loi de finances en vigueur pour l'année déclarée
 *    - le formulaire 2042-C-PRO de l'année (les numéros de case bougent)
 *
 *  Dernière vérification : AUCUNE — valeurs à confronter aux sources
 *  ci-dessus avant tout usage réel.
 * ══════════════════════════════════════════════════════════════════════════ */

export type LmnpRegime = 'longue-duree' | 'tourisme-classe' | 'tourisme-non-classe'

export interface ParamsMicroBic {
    label: string
    /** Taux d'abattement forfaitaire. */
    abattement: number
    /** Plafond de recettes au-delà duquel le régime réel devient obligatoire. */
    plafond: number
}

/**
 * Barèmes par année d'application, la plus récente en premier.
 *
 * Ajouter une entrée quand la loi de finances change les valeurs. Ne jamais
 * modifier une entrée passée : une déclaration rectificative sur une année
 * antérieure doit rester juste.
 */
const BAREMES: { depuis: number; params: Record<LmnpRegime, ParamsMicroBic> }[] = [
    {
        depuis: 2025,
        params: {
            'longue-duree': {
                label: 'Location meublée de longue durée',
                abattement: 0.5,
                plafond: 77_700,
            },
            'tourisme-classe': {
                label: 'Meublé de tourisme classé',
                abattement: 0.5,
                plafond: 77_700,
            },
            'tourisme-non-classe': {
                label: 'Meublé de tourisme non classé',
                abattement: 0.3,
                plafond: 15_000,
            },
        },
    },
]

/** Année la plus récente pour laquelle un barème est renseigné. */
export const DERNIERE_ANNEE_BAREME = Math.max(...BAREMES.map((b) => b.depuis))

/** Abattement plancher (art. 50-0 CGI) : « sans pouvoir être inférieur à 305 € ». */
export const ABATTEMENT_MINIMUM = 305

/**
 * Au-delà de ce montant de recettes, le statut de loueur *professionnel* (LMP)
 * doit être examiné. On ne peut vérifier que cette moitié de la règle : l'autre
 * (recettes supérieures aux autres revenus d'activité du foyer) nous est
 * inconnue. L'alerte doit donc rester au conditionnel.
 */
export const SEUIL_EXAMEN_LMP = 23_000

/** Cases du formulaire 2042-C-PRO (déclarant 1). À revérifier chaque année. */
export const CASES_2042_C_PRO = {
    microBic: '5ND',
    reelBenefice: '5NA',
    reelDeficit: '5NY',
} as const

/** Barème applicable à une année donnée, pour un régime de location. */
export function getBareme(year: number, regime: LmnpRegime): ParamsMicroBic {
    const applicable = BAREMES.filter((b) => b.depuis <= year).sort((a, b) => b.depuis - a.depuis)[0]
    // Aucune entrée antérieure : on retombe sur la plus ancienne connue plutôt
    // que de renvoyer un abattement nul, qui produirait un résultat faussement
    // maximal. `baremeADefaut` signale le cas à l'utilisateur.
    const bareme = applicable ?? BAREMES[BAREMES.length - 1]
    return bareme.params[regime]
}

/* ────────────────────────────── Types ────────────────────────────── */

export interface FiscalPayment {
    amount: number
    date: Date
    typology: string
    periodStart: Date
    periodEnd: Date
    tenantId: string
    tenantName: string
    propertyId: string | null
    propertyName: string | null
}

export interface FiscalExpense {
    id: string
    amount: number
    date: Date
    category: string
    label: string
    note: string | null
    propertyId: string | null
    propertyName: string | null
}

export interface Repartition {
    cle: string
    libelle: string
    montant: number
    /** Part du total, en pourcentage arrondi à l'entier. */
    part: number
    nombre: number
}

export interface RepartitionBien {
    propertyId: string | null
    libelle: string
    recettes: number
    charges: number
    resultat: number
}

export interface MicroBicResult {
    recettes: number
    tauxAbattement: number
    abattement: number
    /** Vrai quand l'abattement plancher de 305 € s'est appliqué. */
    abattementPlancherApplique: boolean
    resultat: number
    plafond: number
    plafondDepasse: boolean
    /** Faux si le plafond est dépassé : le régime réel devient obligatoire. */
    eligible: boolean
}

export interface ReelResult {
    recettes: number
    charges: number
    resultat: number
    deficit: boolean
}

export type RegimeRecommande = 'micro-bic' | 'reel'

export interface Recommandation {
    regime: RegimeRecommande
    /** Écart de résultat imposable entre les deux régimes, en euros. */
    ecart: number
    /** Vrai quand le micro-BIC n'est pas ouvert (plafond dépassé). */
    obligatoire: boolean
    /**
     * Faux quand la conclusion pourrait s'inverser une fois les amortissements
     * pris en compte — c'est-à-dire chaque fois que le micro-BIC l'emporte.
     */
    certaine: boolean
    /** Faux quand l'année est vide : il n'y a alors rien à comparer. */
    comparable: boolean
    message: string
}

export interface FiscalSummary {
    year: number
    regime: LmnpRegime
    regimeLabel: string
    /** Vrai si `year` dépasse la dernière année de barème renseignée. */
    baremeADefaut: boolean

    recettes: {
        total: number
        nombre: number
        parTypologie: Repartition[]
        parLocataire: Repartition[]
    }
    charges: {
        total: number
        nombre: number
        parCategorie: Repartition[]
    }
    parBien: RepartitionBien[]

    microBic: MicroBicResult
    reel: ReelResult
    recommandation: Recommandation
    alertes: string[]
    cases: typeof CASES_2042_C_PRO
}

/* ──────────────────────────── Calculs ───────────────────────────── */

/** Libellé des lignes sans bien rattaché. */
export const NON_AFFECTE = 'Non affecté'

export function computeMicroBic(
    recettes: number,
    year: number,
    regime: LmnpRegime,
): MicroBicResult {
    const { abattement: taux, plafond } = getBareme(year, regime)

    const forfaitaire = recettes * taux
    // Le plancher de 305 € ne peut pas dépasser les recettes : sinon 200 € de
    // recettes donneraient un résultat négatif, qui n'existe pas au micro-BIC.
    const abattement = round(Math.min(recettes, Math.max(forfaitaire, ABATTEMENT_MINIMUM)))
    const plafondDepasse = recettes > plafond

    return {
        recettes: round(recettes),
        tauxAbattement: taux,
        abattement,
        abattementPlancherApplique: recettes > 0 && forfaitaire < ABATTEMENT_MINIMUM,
        resultat: round(Math.max(recettes - abattement, 0)),
        plafond,
        plafondDepasse,
        eligible: !plafondDepasse,
    }
}

export function computeReel(recettes: number, charges: number): ReelResult {
    const resultat = round(recettes - charges)
    return {
        recettes: round(recettes),
        charges: round(charges),
        resultat,
        deficit: resultat < 0,
    }
}

/**
 * Compare les deux régimes.
 *
 * Asymétrie essentielle : le résultat au réel est calculé **sans
 * amortissements**, c'est donc une borne *supérieure* du résultat réellement
 * imposable. Si le réel gagne déjà, les amortissements ne feront que creuser
 * l'écart — la conclusion est sûre. Si le micro-BIC gagne, elle ne l'est pas :
 * l'amortissement du bâti inverse très souvent le verdict.
 */
export function recommendRegime(micro: MicroBicResult, reel: ReelResult): Recommandation {
    const ecart = round(Math.abs(micro.resultat - reel.resultat))

    // Année sans le moindre mouvement : annoncer un régime « plus favorable de
    // 0 € » n'aurait aucun sens.
    if (micro.recettes === 0 && reel.charges === 0) {
        return {
            regime: 'micro-bic',
            ecart: 0,
            obligatoire: false,
            certaine: false,
            comparable: false,
            message:
                "Aucun encaissement ni charge sur l'année : il n'y a rien à comparer. " +
                'Saisissez vos loyers et vos charges pour obtenir une estimation.',
        }
    }

    if (!micro.eligible) {
        return {
            regime: 'reel',
            ecart,
            obligatoire: true,
            certaine: true,
            comparable: true,
            message:
                `Les recettes dépassent le plafond du micro-BIC (${micro.plafond.toLocaleString('fr-FR')} €) : ` +
                'le régime réel est obligatoire.',
        }
    }

    if (reel.resultat < micro.resultat) {
        return {
            regime: 'reel',
            ecart,
            obligatoire: false,
            certaine: true,
            comparable: true,
            message:
                `Le régime réel réduit le résultat imposable de ${ecart.toLocaleString('fr-FR')} € ` +
                'par rapport au micro-BIC, avant même de compter les amortissements — ' +
                "qui ne peuvent qu'accentuer l'écart.",
        }
    }

    return {
        regime: 'micro-bic',
        ecart,
        obligatoire: false,
        certaine: false,
        comparable: true,
        message:
            `Sur les seules charges saisies, le micro-BIC est plus favorable de ${ecart.toLocaleString('fr-FR')} €. ` +
            "Conclusion à confirmer : les amortissements, non calculés ici, s'ajoutent aux charges " +
            'du régime réel et inversent fréquemment ce résultat.',
    }
}

/** Agrège des montants par clé, puis trie du plus élevé au plus faible. */
function grouper<T>(
    items: T[],
    keyOf: (item: T) => { cle: string; libelle: string },
    amountOf: (item: T) => number,
    total: number,
): Repartition[] {
    const buckets = new Map<string, { libelle: string; montants: number[] }>()

    for (const item of items) {
        const { cle, libelle } = keyOf(item)
        const bucket = buckets.get(cle) ?? { libelle, montants: [] }
        bucket.montants.push(amountOf(item))
        buckets.set(cle, bucket)
    }

    return [...buckets.entries()]
        .map(([cle, { libelle, montants }]) => {
            const montant = sumAmounts(montants.map((amount) => ({ amount })))
            return {
                cle,
                libelle,
                montant,
                part: total > 0 ? Math.round((montant / total) * 100) : 0,
                nombre: montants.length,
            }
        })
        .sort((a, b) => b.montant - a.montant)
}

export function buildFiscalSummary(input: {
    year: number
    payments: FiscalPayment[]
    expenses: FiscalExpense[]
    regime?: LmnpRegime
}): FiscalSummary {
    const { year, payments, expenses, regime = 'longue-duree' } = input

    // Le dépôt de garantie n'est pas un revenu : il est détenu pour le compte du
    // locataire. La CAF, elle, règle le loyer à sa place et compte donc bien.
    const recettesPayments = payments.filter(isRentPayment)

    const totalRecettes = sumAmounts(recettesPayments)
    const totalCharges = sumAmounts(expenses)

    const parTypologie = grouper(
        recettesPayments,
        (p) => ({ cle: p.typology, libelle: PAYMENT_TYPE_LABELS[p.typology] ?? p.typology }),
        (p) => p.amount,
        totalRecettes,
    )

    const parLocataire = grouper(
        recettesPayments,
        (p) => ({ cle: p.tenantId, libelle: p.tenantName }),
        (p) => p.amount,
        totalRecettes,
    )

    const parCategorie = grouper(
        expenses,
        (e) => ({ cle: e.category, libelle: expenseCategoryLabel(e.category) }),
        (e) => e.amount,
        totalCharges,
    )

    const parBien = buildParBien(recettesPayments, expenses)

    const microBic = computeMicroBic(totalRecettes, year, regime)
    const reel = computeReel(totalRecettes, totalCharges)
    const recommandation = recommendRegime(microBic, reel)

    const baremeADefaut = year > DERNIERE_ANNEE_BAREME
    const alertes = buildAlertes({ year, totalRecettes, microBic, baremeADefaut })

    return {
        year,
        regime,
        regimeLabel: getBareme(year, regime).label,
        baremeADefaut,
        recettes: {
            total: totalRecettes,
            nombre: recettesPayments.length,
            parTypologie,
            parLocataire,
        },
        charges: {
            total: totalCharges,
            nombre: expenses.length,
            parCategorie,
        },
        parBien,
        microBic,
        reel,
        recommandation,
        alertes,
        cases: CASES_2042_C_PRO,
    }
}

function buildParBien(payments: FiscalPayment[], expenses: FiscalExpense[]): RepartitionBien[] {
    const buckets = new Map<string, { libelle: string; recettes: number[]; charges: number[] }>()

    const bucketFor = (propertyId: string | null, propertyName: string | null) => {
        const cle = propertyId ?? ''
        const existing = buckets.get(cle)
        if (existing) return existing
        const created = {
            libelle: propertyName ?? NON_AFFECTE,
            recettes: [] as number[],
            charges: [] as number[],
        }
        buckets.set(cle, created)
        return created
    }

    for (const payment of payments) {
        bucketFor(payment.propertyId, payment.propertyName).recettes.push(payment.amount)
    }
    for (const expense of expenses) {
        bucketFor(expense.propertyId, expense.propertyName).charges.push(expense.amount)
    }

    return [...buckets.entries()]
        .map(([cle, { libelle, recettes, charges }]) => {
            const totalRecettes = sumAmounts(recettes.map((amount) => ({ amount })))
            const totalCharges = sumAmounts(charges.map((amount) => ({ amount })))
            return {
                propertyId: cle === '' ? null : cle,
                libelle,
                recettes: totalRecettes,
                charges: totalCharges,
                resultat: round(totalRecettes - totalCharges),
            }
        })
        .sort((a, b) => {
            // « Non affecté » toujours en dernier, le reste par recettes décroissantes.
            if (a.propertyId === null) return 1
            if (b.propertyId === null) return -1
            return b.recettes - a.recettes
        })
}

function buildAlertes(input: {
    year: number
    totalRecettes: number
    microBic: MicroBicResult
    baremeADefaut: boolean
}): string[] {
    const { year, totalRecettes, microBic, baremeADefaut } = input
    const alertes: string[] = []

    if (baremeADefaut) {
        alertes.push(
            `Aucun barème n'est renseigné pour ${year} : le calcul reprend celui de ` +
                `${DERNIERE_ANNEE_BAREME}. À mettre à jour dès la publication de la loi de finances.`,
        )
    }

    if (microBic.plafondDepasse) {
        alertes.push(
            `Les recettes (${totalRecettes.toLocaleString('fr-FR')} €) dépassent le plafond du ` +
                `micro-BIC (${microBic.plafond.toLocaleString('fr-FR')} €) : le régime réel est obligatoire.`,
        )
    }

    if (totalRecettes > SEUIL_EXAMEN_LMP) {
        alertes.push(
            `Les recettes dépassent ${SEUIL_EXAMEN_LMP.toLocaleString('fr-FR')} € : le statut de loueur ` +
                'professionnel (LMP) est à vérifier. Il dépend aussi des autres revenus du foyer, ' +
                "que l'application ne connaît pas.",
        )
    }

    if (microBic.abattementPlancherApplique) {
        alertes.push(
            `L'abattement plancher de ${ABATTEMENT_MINIMUM} € s'applique : il est plus favorable ` +
                "que l'abattement forfaitaire sur des recettes aussi faibles.",
        )
    }

    return alertes
}
