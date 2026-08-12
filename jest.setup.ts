import '@testing-library/jest-dom'

/**
 * `next-auth` est publié en ESM pur et n'est pas transformé par Jest : tout
 * module remontant à `@/auth` échouait au chargement (4 suites sur 7).
 * La fabrique ci-dessous remplace `src/auth.ts` sans jamais l'évaluer.
 *
 * La session est valide par défaut ; un test peut la retirer le temps d'un
 * appel avec `(auth as jest.Mock).mockResolvedValueOnce(null)`.
 */
jest.mock('@/auth', () => ({
    __esModule: true,
    auth: jest.fn(async () => ({
        user: { email: 'proprietaire@example.com', name: 'Test' },
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: { GET: jest.fn(), POST: jest.fn() },
}))
