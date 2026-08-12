import { createTenantSchema, landlordSchema, paymentSchema, propertySchema } from './validation'

describe('createTenantSchema', () => {
    const base = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: '',
        phone: '',
        propertyId: '',
        address: '3 rue des Lilas',
        postalCode: '75011',
        city: 'Paris',
        rentAmount: '650',
        chargeAmount: '50',
        startDate: '2026-01-15',
    }

    it('accepte un dossier complet et convertit les montants', () => {
        const result = createTenantSchema.safeParse(base)

        expect(result.success).toBe(true)
        expect(result.data?.rentAmount).toBe(650)
        expect(result.data?.email).toBeNull()
    })

    it('accepte les montants saisis à la française', () => {
        const result = createTenantSchema.safeParse({ ...base, rentAmount: '1 234,56' })

        expect(result.data?.rentAmount).toBeCloseTo(1234.56)
    })

    it('rejette un email mal formé', () => {
        const result = createTenantSchema.safeParse({ ...base, email: 'jean@' })

        expect(result.success).toBe(false)
    })

    it("n'exige pas l'adresse quand un bien est rattaché", () => {
        const result = createTenantSchema.safeParse({
            ...base,
            propertyId: 'p1',
            address: '',
            postalCode: '',
            city: '',
        })

        expect(result.success).toBe(true)
    })

    it('rejette un code postal non français', () => {
        const result = createTenantSchema.safeParse({ ...base, postalCode: '7501' })

        expect(result.success).toBe(false)
    })
})

describe('paymentSchema', () => {
    const base = {
        tenantId: 't1',
        amount: '650',
        date: '2026-02-03',
        periodMonth: '2',
        periodYear: '2026',
        type: 'Loyer',
    }

    it('accepte un paiement valide', () => {
        expect(paymentSchema.safeParse(base).success).toBe(true)
    })

    it('rejette un montant négatif', () => {
        expect(paymentSchema.safeParse({ ...base, amount: '-10' }).success).toBe(false)
    })

    it('rejette un mois hors bornes', () => {
        expect(paymentSchema.safeParse({ ...base, periodMonth: '13' }).success).toBe(false)
    })

    it('rejette une nature inconnue', () => {
        expect(paymentSchema.safeParse({ ...base, type: 'Chèque' }).success).toBe(false)
    })
})

describe('propertySchema', () => {
    it('rejette un type de bien inconnu', () => {
        const result = propertySchema.safeParse({
            name: 'Studio',
            address: '1 rue A',
            postalCode: '75001',
            city: 'Paris',
            type: 'Château',
        })

        expect(result.success).toBe(false)
    })
})

describe('landlordSchema', () => {
    const base = {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie@example.com',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        siret: '',
        companyName: '',
    }

    it('accepte les champs facultatifs vides', () => {
        const result = landlordSchema.safeParse(base)

        expect(result.success).toBe(true)
        expect(result.data?.siret).toBeNull()
    })

    it('normalise un SIRET espacé', () => {
        const result = landlordSchema.safeParse({ ...base, siret: '123 456 789 01234' })

        expect(result.data?.siret).toBe('12345678901234')
    })

    it('rejette un SIRET trop court', () => {
        expect(landlordSchema.safeParse({ ...base, siret: '12345' }).success).toBe(false)
    })
})
