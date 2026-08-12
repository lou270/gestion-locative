'use client'

import dynamic from 'next/dynamic'
import type { ChartPoint } from './RevenueChartImpl'

const ChartSkeleton = () => <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100" />

// Recharts s'appuie sur les dimensions réelles du conteneur : le rendre côté
// serveur provoquerait une divergence d'hydratation.
const Chart = dynamic(() => import('./RevenueChartImpl').then((m) => m.RevenueChartImpl), {
    ssr: false,
    loading: ChartSkeleton,
})

export function RevenueChart({ data }: { data: ChartPoint[] }) {
    return <Chart data={data} />
}
