import {
    BLOCK_MS,
    clearLoginAttempts,
    clientKeyFromHeaders,
    formatRetryDelay,
    getLoginStatus,
    MAX_ATTEMPTS,
    registerLoginFailure,
    resetLoginAttempts,
    WINDOW_MS,
} from './rate-limit'

const T0 = 1_800_000_000_000

const failTimes = (key: string, count: number, at = T0) => {
    for (let i = 0; i < count; i++) registerLoginFailure(key, at)
}

describe('limitation des tentatives de connexion', () => {
    beforeEach(() => resetLoginAttempts())

    it('laisse passer une clé inconnue', () => {
        expect(getLoginStatus('ip:1.2.3.4', T0)).toEqual({
            blocked: false,
            retryAfterMs: 0,
            remaining: MAX_ATTEMPTS,
        })
    })

    it('décompte les essais restants', () => {
        failTimes('ip:1.2.3.4', 2)

        expect(getLoginStatus('ip:1.2.3.4', T0).remaining).toBe(MAX_ATTEMPTS - 2)
    })

    it('bloque au seuil atteint', () => {
        failTimes('ip:1.2.3.4', MAX_ATTEMPTS)

        const status = getLoginStatus('ip:1.2.3.4', T0)
        expect(status.blocked).toBe(true)
        expect(status.retryAfterMs).toBe(BLOCK_MS)
    })

    it('libère la clé une fois le délai écoulé', () => {
        failTimes('ip:1.2.3.4', MAX_ATTEMPTS)

        expect(getLoginStatus('ip:1.2.3.4', T0 + BLOCK_MS + 1).blocked).toBe(false)
    })

    it('ne bloque pas des essais espacés au-delà de la fenêtre', () => {
        for (let i = 0; i < MAX_ATTEMPTS * 2; i++) {
            registerLoginFailure('ip:1.2.3.4', T0 + i * (WINDOW_MS + 1000))
        }

        expect(getLoginStatus('ip:1.2.3.4', T0 + MAX_ATTEMPTS * 2 * (WINDOW_MS + 1000)).blocked).toBe(
            false,
        )
    })

    it('remet le compteur à zéro après une connexion réussie', () => {
        failTimes('ip:1.2.3.4', MAX_ATTEMPTS - 1)
        clearLoginAttempts('ip:1.2.3.4')

        expect(getLoginStatus('ip:1.2.3.4', T0).remaining).toBe(MAX_ATTEMPTS)
    })

    it('isole les clés les unes des autres', () => {
        failTimes('ip:1.2.3.4', MAX_ATTEMPTS)

        expect(getLoginStatus('ip:5.6.7.8', T0).blocked).toBe(false)
    })
})

describe('clientKeyFromHeaders', () => {
    const headersOf = (values: Record<string, string>) => ({
        get: (name: string) => values[name.toLowerCase()] ?? null,
    })

    it('retient la dernière entrée de X-Forwarded-For', () => {
        // La partie gauche est fournie par le client : un attaquant y injecterait
        // une valeur différente à chaque essai pour repartir d'un compteur neuf.
        // Le proxy ajoute l'adresse réellement vue en fin de liste.
        const key = clientKeyFromHeaders(
            headersOf({ 'x-forwarded-for': '10.0.0.1, 203.0.113.9, 198.51.100.7' }),
        )

        expect(key).toBe('ip:198.51.100.7')
    })

    it('retombe sur X-Real-IP', () => {
        expect(clientKeyFromHeaders(headersOf({ 'x-real-ip': '203.0.113.9' }))).toBe(
            'ip:203.0.113.9',
        )
    })

    it('retombe sur l’identifiant fourni sans en-tête de proxy', () => {
        expect(clientKeyFromHeaders(headersOf({}), 'jean@example.com')).toBe('id:jean@example.com')
    })
})

describe('formatRetryDelay', () => {
    it('exprime les courts délais en secondes', () => {
        expect(formatRetryDelay(30_000)).toBe('30 secondes')
        expect(formatRetryDelay(1_000)).toBe('1 seconde')
    })

    it('exprime les longs délais en minutes', () => {
        expect(formatRetryDelay(15 * 60 * 1000)).toBe('15 minutes')
        expect(formatRetryDelay(61_000)).toBe('2 minutes')
    })
})
