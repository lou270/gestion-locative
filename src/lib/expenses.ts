/**
 * Catégories de charges déductibles.
 *
 * Pendant de `PAYMENT_TYPES` / `PAYMENT_TYPE_LABELS` dans `ledger.ts`, dans un
 * fichier séparé : `ledger.ts` porte la logique comptable d'un *dossier
 * locataire*, or une charge n'est pas rattachée à un locataire.
 *
 * Les valeurs stockées en base sont sans accent et en PascalCase — comme
 * `'Regularisation'` dans `PAYMENT_TYPES`. Les accents vivent dans les libellés.
 */

export const EXPENSE_CATEGORIES = [
    'TaxeFonciere',
    'CFE',
    'AssurancePNO',
    'AssuranceGLI',
    'Travaux',
    'ChargesCopropriete',
    'InteretsEmprunt',
    'AssuranceEmprunteur',
    'HonorairesComptables',
    'FraisGestion',
    'FraisBancaires',
    'Mobilier',
    'Abonnements',
    'Autres',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    TaxeFonciere: 'Taxe foncière',
    CFE: 'CFE (cotisation foncière des entreprises)',
    AssurancePNO: 'Assurance PNO (propriétaire non occupant)',
    AssuranceGLI: 'Assurance loyers impayés (GLI)',
    Travaux: 'Travaux & entretien',
    ChargesCopropriete: 'Charges de copropriété',
    InteretsEmprunt: "Intérêts d'emprunt",
    AssuranceEmprunteur: 'Assurance emprunteur',
    HonorairesComptables: 'Honoraires comptables',
    FraisGestion: 'Frais de gestion locative',
    FraisBancaires: 'Frais bancaires',
    Mobilier: 'Petit mobilier & équipement',
    Abonnements: 'Abonnements (internet, logiciels…)',
    Autres: 'Autres charges',
}

/**
 * Pièges de déductibilité, affichés sous le sélecteur de catégorie.
 * Rien ne bloque la saisie : c'est un avertissement, pas une règle.
 */
export const EXPENSE_CATEGORY_HINTS: Record<string, string> = {
    Travaux:
        "Seuls l'entretien et la réparation sont déductibles. L'amélioration, " +
        "l'agrandissement et la construction relèvent de l'amortissement.",
    Mobilier: 'Au-delà de 600 € TTC par bien, le mobilier doit être amorti et non déduit.',
    InteretsEmprunt:
        "Seuls les intérêts et l'assurance sont déductibles, jamais le capital remboursé.",
}

/** Libellé lisible d'une catégorie, tolérant aux valeurs héritées. */
export function expenseCategoryLabel(category: string): string {
    return EXPENSE_CATEGORY_LABELS[category] ?? category
}
