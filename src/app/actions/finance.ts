'use server'

import prisma from '@/lib/prisma'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import { getTenantBalance, isRentPayment, round } from '@/lib/ledger'

export interface OverdueTenant {
    id: string
    firstName: string
    lastName: string
    propertyName: string | null
    balance: number
}

export interface FinancialStats {
    chartData: { name: string; revenu: number }[]
    /** Encaissements de loyer de l'année en cours (dépôts de garantie exclus). */
    totalYearly: number
    /** Loyer + charges attendus chaque mois pour les baux en cours. */
    monthlyRentRoll: number
    occupancyRate: number
    totalProperties: number
    rentedPropertiesCount: number
    activeTenantsCount: number
    /** Somme des soldes débiteurs, tous locataires confondus. */
    totalOverdue: number
    overdueTenants: OverdueTenant[]
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => {
    const label = new Date(2000, i, 1).toLocaleString('fr-FR', { month: 'long' })
    return label.charAt(0).toUpperCase() + label.slice(1)
})

export async function getFinancialStats(): Promise<
    { success: true; data: FinancialStats } | { success: false; error: string }
> {
    try {
        await requireSession()

        const now = new Date()
        const currentYear = now.getFullYear()

        const [payments, properties, tenants] = await Promise.all([
            prisma.payment.findMany({
                where: {
                    // Borne haute exclusive : `lte: 31 décembre` à minuit excluait
                    // les paiements enregistrés le dernier jour de l'année.
                    date: {
                        gte: new Date(currentYear, 0, 1),
                        lt: new Date(currentYear + 1, 0, 1),
                    },
                },
                select: { amount: true, date: true, typology: true },
            }),
            prisma.property.count(),
            prisma.tenant.findMany({
                include: {
                    payments: {
                        select: {
                            amount: true,
                            date: true,
                            periodStart: true,
                            typology: true,
                        },
                    },
                    property: { select: { id: true, name: true } },
                },
            }),
        ])

        // Un dépôt de garantie est une somme détenue pour le compte du locataire,
        // pas un revenu : il ne doit pas gonfler le chiffre d'affaires.
        const revenuePayments = payments.filter(isRentPayment)

        const monthlyRevenue = new Array(12).fill(0)
        for (const payment of revenuePayments) {
            monthlyRevenue[payment.date.getMonth()] += payment.amount
        }

        const chartData = MONTH_LABELS.map((name, index) => ({
            name,
            revenu: round(monthlyRevenue[index]),
        }))

        const totalYearly = round(revenuePayments.reduce((sum, p) => sum + p.amount, 0))

        const activeTenants = tenants.filter((t) => !t.endDate || t.endDate >= now)

        const monthlyRentRoll = round(
            activeTenants.reduce((sum, t) => sum + t.rentAmount + t.chargeAmount, 0),
        )

        const rentedPropertyIds = new Set(
            activeTenants.map((t) => t.propertyId).filter((id): id is string => Boolean(id)),
        )
        const rentedPropertiesCount = rentedPropertyIds.size
        const occupancyRate =
            properties > 0 ? Math.round((rentedPropertiesCount / properties) * 100) : 0

        const overdueTenants: OverdueTenant[] = []
        for (const tenant of tenants) {
            const { balance } = getTenantBalance(tenant, tenant.payments, now)
            if (balance < -0.01) {
                overdueTenants.push({
                    id: tenant.id,
                    firstName: tenant.firstName,
                    lastName: tenant.lastName,
                    propertyName: tenant.property?.name ?? null,
                    balance,
                })
            }
        }
        overdueTenants.sort((a, b) => a.balance - b.balance)

        const totalOverdue = round(overdueTenants.reduce((sum, t) => sum + Math.abs(t.balance), 0))

        return {
            success: true,
            data: {
                chartData,
                totalYearly,
                monthlyRentRoll,
                occupancyRate,
                totalProperties: properties,
                rentedPropertiesCount,
                activeTenantsCount: activeTenants.length,
                totalOverdue,
                overdueTenants,
            },
        }
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: error.message }
        console.error('Error fetching financial stats:', error)
        return { success: false, error: 'Impossible de calculer les statistiques.' }
    }
}
