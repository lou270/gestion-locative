'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/format'

export interface ChartPoint {
    name: string
    revenu: number
}

/**
 * Implémentation du graphique. Chargée uniquement côté client par
 * `RevenueChart` : Recharts mesure le DOM et produirait sinon un HTML serveur
 * différent du HTML client.
 */
export function RevenueChartImpl({ data }: { data: ChartPoint[] }) {
    const hasRevenue = data.some((point) => point.revenu > 0)

    if (!hasRevenue) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                Aucun encaissement enregistré cette année.
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="#94a3b8"
                        tickFormatter={(value: string) => value.slice(0, 3)}
                    />
                    <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="#94a3b8"
                        width={64}
                        tickFormatter={(value: number) => `${value} €`}
                    />
                    <Tooltip
                        cursor={{ fill: '#eef2ff' }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Encaissé']}
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 8px 20px -8px rgb(15 23 42 / 0.2)',
                            fontSize: '13px',
                        }}
                    />
                    <Bar dataKey="revenu" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
