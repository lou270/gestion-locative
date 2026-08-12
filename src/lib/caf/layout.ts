/**
 * Cartographie de la page 1 du Cerfa 10842*07 — « Attestation de loyer » CAF.
 *
 * Le formulaire distribué par la CAF est un PDF **plat** : il ne contient aucun
 * champ AcroForm, uniquement du texte et des traits dessinés. Le remplissage
 * consiste donc à superposer du texte à des coordonnées fixes.
 *
 * Les coordonnées ci-dessous ont été relevées sur le document réel (A4,
 * 595 × 842 pt). Elles sont exprimées dans le repère PDF (origine en bas à
 * gauche), contrairement aux outils d'extraction qui comptent depuis le haut.
 *
 * ⚠️ Ces positions ne valent que pour le millésime *07 du Cerfa 10842.
 * `verifyCafForm()` refuse tout document dont l'empreinte diffère, pour éviter
 * d'inscrire des informations en face des mauvaises rubriques.
 */

export const PAGE_WIDTH = 595
export const PAGE_HEIGHT = 842

/** Un champ texte libre : origine gauche, ligne de base, largeur utile. */
export interface TextSlot {
    x: number
    y: number
    width: number
}

/** Une suite de cases d'un caractère chacune (11,25 pt de large sur ce Cerfa). */
export interface CellSlot {
    /** Bord gauche de chaque case, dans l'ordre de saisie. */
    xs: number[]
    /** Largeur d'une case. */
    cellWidth: number
    y: number
}

/** Une case à cocher, repérée par son coin inférieur gauche. */
export interface CheckboxSlot {
    x: number
    y: number
    size: number
}

const slot = (x: number, bottom: number, right: number): TextSlot => ({
    x: x + 2,
    // La ligne de base se situe environ 2,2 pt au-dessus du bas de la ligne.
    y: PAGE_HEIGHT - (bottom - 2.2),
    width: right - x - 4,
})

const cells = (xs: number[], bottom: number, cellWidth = 11.25): CellSlot => ({
    xs,
    cellWidth,
    y: PAGE_HEIGHT - (bottom - 2.2),
})

const checkbox = (x: number, top: number): CheckboxSlot => ({
    x,
    y: PAGE_HEIGHT - (top + 9.8),
    size: 10.1,
})

export const CAF_LAYOUT = {
    // --- Identité du bailleur ------------------------------------------
    landlordName: slot(341.5, 121.0, 565.8),
    landlordAddress: slot(69.1, 134.4, 565.3),
    landlordPhone: cells(
        [101.3, 112.6, 129.6, 140.9, 157.9, 169.2, 186.2, 197.5, 214.6, 225.8],
        147.9,
    ),
    landlordFax: cells(
        [73.4, 84.7, 101.8, 113.0, 130.1, 141.4, 158.4, 169.7, 186.7, 198.0],
        161.3,
    ),
    landlordEmailLocal: slot(293.0, 161.3, 422.3),
    landlordEmailDomain: slot(437.0, 161.3, 566.3),
    landlordSiret: slot(75.6, 174.7, 566.5),

    // --- Locataires ----------------------------------------------------
    tenant1: slot(254.6, 188.2, 341.6),
    tenant2: slot(478.8, 188.2, 565.8),
    /** « locataire(s) en titre depuis le » : JJ MM AAAA sur 8 cases. */
    startDate: cells([186.5, 197.8, 214.8, 226.1, 243.1, 254.4, 265.7, 277.0], 201.6),

    // --- Logement ------------------------------------------------------
    housingAddressLine1: slot(447.6, 201.6, 566.3),
    housingAddressLine2: slot(28.3, 215.1, 566.7),
    singleRoomYes: checkbox(242.4, 216.8),
    singleRoomNo: checkbox(283.7, 216.8),
    surface: cells([230.9, 242.2, 253.4], 241.9),
    coTenancyYes: checkbox(228.0, 243.7),
    coTenancyNo: checkbox(269.3, 243.7),
    coTenantsCount: cells([535.2], 253.5, 11.3),

    // --- Loyers --------------------------------------------------------
    /** Mois d'entrée dans les lieux (rubrique « précisez ce mois »). */
    entryMonth: slot(255.4, 282.3, 371.4),
    entryRent: slot(137.5, 295.7, 182.3),
    entryCharges: slot(285.4, 295.7, 330.1),
    entryFurnishedTotal: slot(507.1, 295.7, 557.1),
    coTenancyTotal: slot(217.9, 309.1, 328.7),

    /** Rubrique « mois de juillet », millésime sur 4 cases. */
    julyYear: cells([196.3, 207.6, 218.9, 230.2], 322.6, 11.3),
    julyRent: slot(137.5, 336.0, 182.3),
    julyCharges: slot(285.4, 336.0, 330.1),
    julyFurnishedTotal: slot(507.1, 336.0, 557.1),

    // --- Situation du locataire ----------------------------------------
    upToDateYes: checkbox(353.0, 337.8),
    upToDateNo: checkbox(394.3, 337.8),
    lastPaidMonth: slot(377.5, 362.9, 564.8),
    subletYes: checkbox(160.6, 364.6),
    subletNo: checkbox(201.8, 364.6),
    hotelYes: checkbox(233.0, 391.5),
    hotelNo: checkbox(274.3, 391.5),

    // --- Aide au logement / décence ------------------------------------
    directPaymentYes: checkbox(113.3, 530.2),
    directPaymentNo: checkbox(154.6, 530.2),
    decencyYes: checkbox(362.6, 543.7),
    decencyNo: checkbox(403.9, 543.7),

    // --- Signature -----------------------------------------------------
    signaturePlace: slot(37.0, 673.2, 200.5),
    /** Date de signature : JJ MM AAAA sur 8 cases. */
    signatureDate: cells([215.8, 227.0, 244.1, 255.4, 272.4, 283.7, 295.0, 306.2], 673.2),
} as const

/**
 * Empreinte géométrique du formulaire : coin inférieur gauche, **en points**,
 * des 19 cases à cocher de la page 1. Deux formulaires différents (ou deux
 * millésimes du même) ne partagent pas cette disposition.
 */
export const CAF_FINGERPRINT_CHECKBOXES: [number, number][] = [
    [242.4, 615.36], [283.68, 615.36], // chambre unique : oui / non
    [228.0, 588.48], [269.28, 588.48], // colocation : oui / non
    [353.04, 494.4], [394.32, 494.4], // à jour des loyers : oui / non
    [160.56, 467.52], [201.84, 467.52], // sous-location : oui / non
    [56.64, 454.08], [224.4, 454.08], [369.6, 454.08], // type de sous-location
    [233.04, 440.64], [274.32, 440.64], // hôtel ou pension : oui / non
    [56.64, 370.56], [226.56, 370.56], // convention : signée le / renouvelée le
    [113.28, 301.92], [154.56, 301.92], // versement direct : oui / non
    [362.64, 288.48], [403.92, 288.48], // décence : oui / non
]

/** Dimensions d'une case à cocher, en points. */
export const CHECKBOX_SIZE = { width: 10.08, height: 9.84 }
