
'use server'

import prisma from '@/lib/prisma'

export async function getFinancialStats() {
    try {
        const now = new Date()
        const currentYear = now.getFullYear()

        // Get all payments for the current year
        const payments = await prisma.payment.findMany({
            where: {
                date: {
                    gte: new Date(currentYear, 0, 1),
                    lte: new Date(currentYear, 11, 31)
                }
            }
        })

        // Aggregate by month
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthName = new Date(currentYear, i).toLocaleString('fr-FR', { month: 'long' })
            return {
                name: monthName,
                monthIndex: i, // Tri par index
                amount: 0
            }
        })

        payments.forEach(payment => {
            const month = payment.date.getMonth()
            monthlyRevenue[month].amount += payment.amount
        })

        // Format for Recharts
        const data = monthlyRevenue.map(m => ({
            name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
            revenu: parseFloat(m.amount.toFixed(2))
        }))

        // Calculer le total annuel
        const totalYearly = payments.reduce((sum, p) => sum + p.amount, 0)

        // Calculer le taux d'occupation (Nbre de locataires actifs / Nbre de biens)
        const totalProperties = await prisma.property.count()
        const activeTenants = await prisma.tenant.count({
            where: {
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            }
        })

        // Note: C'est un taux "brut", pas par bien. Si 1 bien a 2 locataires (coloc), cela peut dépasser 100% ou être incorrect selon la logique métier.
        // Simplification : On compare "Nombre de biens loués" vs "Total biens".
        // Pour être plus précis, il faudrait voir quels biens ont au moins 1 locataire actif.
        const rentedPropertiesCount = await prisma.property.count({
            where: {
                tenants: {
                    some: {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                }
            }
        })

        const occupancyRate = totalProperties > 0 ? (rentedPropertiesCount / totalProperties) * 100 : 0

        return {
            success: true,
            data: {
                chartData: data,
                totalYearly,
                occupancyRate: Math.round(occupancyRate),
                totalProperties,
                rentedPropertiesCount
            }
        }

    } catch (error) {
        console.error("Error fetching financial stats:", error)
        return { success: false, error: 'Failed to fetch financial stats' }
    }
}
