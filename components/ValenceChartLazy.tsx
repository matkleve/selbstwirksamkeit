'use client'

import dynamic from 'next/dynamic'
import type { ChartPoint } from '@/components/ValenceChart'

const ValenceChart = dynamic(() => import('@/components/ValenceChart'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 160, borderRadius: 8, background: 'var(--bg-subtle)' }} aria-hidden />
  ),
})

export default function ValenceChartLazy({ data }: { data: ChartPoint[] }) {
  return <ValenceChart data={data} />
}
