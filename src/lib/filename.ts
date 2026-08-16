/**
 * Nettoie un nom de fichier destiné à l'en-tête `Content-Disposition`.
 * Un nom de locataire contenant un guillemet, un retour à la ligne ou un
 * accent casserait l'en-tête (voire permettrait d'y injecter des directives).
 *
 * Vit dans son propre module — et non dans `pdf-response.ts` — pour être
 * importable depuis la route d'export CSV sans embarquer `@react-pdf/renderer`.
 */
export function safeFilename(value: string, fallback = 'document'): string {
    const ascii = value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return ascii || fallback
}
