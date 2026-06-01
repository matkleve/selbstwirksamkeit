import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/components/Nav'
import SignOut from '@/components/SignOut'
import type { Entry, BodyState } from '@/lib/types'

const ENTRY_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: true })

  const entries = (data ?? []) as Entry[]

  // ── Balance this week ──
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = entries.filter(e => new Date(e.created_at) >= weekAgo)
  const posCount = thisWeek.filter(e => e.grid_x !== null && e.grid_x > 0).length
  const negCount = thisWeek.filter(e => e.grid_x !== null && e.grid_x < 0).length

  // ── Last 14 days chart data ──
  const now = new Date()
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (13 - i))
    return d
  })
  const chartData = days14.map(day => {
    const ds = day.toDateString()
    const dayEntries = entries.filter(e => new Date(e.created_at).toDateString() === ds && e.grid_x !== null)
    if (!dayEntries.length) return { day, value: null as number | null }
    return { day, value: dayEntries.reduce((s, e) => s + (e.grid_x ?? 0), 0) / dayEntries.length }
  })

  // ── SVG chart ──
  const cW = 320, cH = 120
  const pad = { t: 16, r: 12, b: 20, l: 28 }
  const iW = cW - pad.l - pad.r
  const iH = cH - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / 13) * iW
  const toY = (v: number) => pad.t + ((5 - v) / 10) * iH
  const zeroY = toY(0)

  const validIdx = chartData.reduce<number[]>((a, d, i) => { if (d.value !== null) a.push(i); return a }, [])
  const segments = validIdx.slice(1).reduce<Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>>((acc, j, k) => {
    const i = validIdx[k]
    if (j === i + 1) {
      const v1 = chartData[i].value!
      const v2 = chartData[j].value!
      acc.push({ x1: toX(i), y1: toY(v1), x2: toX(j), y2: toY(v2), color: (v1 + v2) / 2 >= 0 ? '#3B7DD8' : '#C4603A' })
    }
    return acc
  }, [])
  const dots = validIdx.map(i => ({ cx: toX(i), cy: toY(chartData[i].value!), pos: chartData[i].value! >= 0 }))

  // ── Quadrant heatmap ──
  const gridEntries = entries.filter(e => e.grid_x !== null && e.grid_y !== null)
  const qCounts = { 'pos-other': 0, 'pos-self': 0, 'neg-other': 0, 'neg-self': 0 }
  gridEntries.forEach(e => {
    if (e.grid_x! >= 0 && e.grid_y! >= 0) qCounts['pos-other']++
    else if (e.grid_x! >= 0 && e.grid_y! < 0) qCounts['pos-self']++
    else if (e.grid_x! < 0 && e.grid_y! >= 0) qCounts['neg-other']++
    else qCounts['neg-self']++
  })
  const showHeatmap = gridEntries.length >= 5
  const maxQ = Math.max(...Object.values(qCounts), 1)

  // ── Body state patterns ──
  const bodyGroups = (['stressed', 'calm', 'tired'] as BodyState[]).map(state => {
    const group = entries.filter(e => e.body_state === state && e.grid_x !== null)
    return { state, avg: group.length ? group.reduce((s, e) => s + (e.grid_x ?? 0), 0) / group.length : null, count: group.length }
  }).filter(g => g.count >= 3)

  const stateLabel = (s: BodyState) => s === 'stressed' ? 'gestresst' : s === 'calm' ? 'ruhig' : 'müde'

  const bodyPatterns: string[] = []
  for (let i = 0; i < bodyGroups.length; i++) {
    for (let j = i + 1; j < bodyGroups.length; j++) {
      const diff = Math.abs(bodyGroups[i].avg! - bodyGroups[j].avg!)
      if (diff >= 2) {
        const lo = bodyGroups[i].avg! < bodyGroups[j].avg! ? bodyGroups[i] : bodyGroups[j]
        const hi = bodyGroups[i].avg! < bodyGroups[j].avg! ? bodyGroups[j] : bodyGroups[i]
        bodyPatterns.push(
          `Wenn du ${stateLabel(lo.state)} bist, liegen deine Einträge im Schnitt bei ${lo.avg!.toFixed(1)}. ${stateLabel(hi.state).charAt(0).toUpperCase() + stateLabel(hi.state).slice(1)} bei +${hi.avg!.toFixed(1)}.`
        )
      }
    }
  }

  const heatmapRows: Array<{ key: keyof typeof qCounts; label: string; color: string }[]> = [
    [
      { key: 'neg-other', label: 'neg / andere', color: '#C4603A' },
      { key: 'pos-other', label: 'pos / andere', color: '#3B7DD8' },
    ],
    [
      { key: 'neg-self', label: 'neg / ich', color: '#C4603A' },
      { key: 'pos-self', label: 'pos / ich', color: '#3B7DD8' },
    ],
  ]

  const cardStyle: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 20, marginBottom: 16 }
  const h2Style: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            Selbstwirksamkeit
          </h1>
          <Nav />
          <SignOut />
        </header>

        {entries.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem', padding: 40 }}>
            Noch keine Einträge.
          </div>
        ) : (
          <>
            {/* Balance */}
            <div style={cardStyle}>
              <p style={h2Style}>Diese Woche</p>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {posCount} gute Einträge · {negCount} schwierige
              </p>
            </div>

            {/* Valence chart */}
            {dots.length > 1 && (
              <div style={cardStyle}>
                <p style={h2Style}>Letzte 14 Tage</p>
                <svg width={cW} height={cH} style={{ display: 'block', maxWidth: '100%' }}>
                  {/* Zero dashed line */}
                  <line x1={pad.l} y1={zeroY} x2={cW - pad.r} y2={zeroY} stroke="var(--border-focus)" strokeWidth={1} strokeDasharray="4,3" />
                  {/* Y labels */}
                  <text x={pad.l - 4} y={pad.t + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">+5</text>
                  <text x={pad.l - 4} y={zeroY + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">0</text>
                  <text x={pad.l - 4} y={cH - pad.b + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">−5</text>
                  {/* Segments */}
                  {segments.map((s, i) => (
                    <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={2} strokeLinecap="round" />
                  ))}
                  {/* Dots */}
                  {dots.map((d, i) => (
                    <circle key={i} cx={d.cx} cy={d.cy} r={3} fill={d.pos ? '#3B7DD8' : '#C4603A'} />
                  ))}
                </svg>
              </div>
            )}

            {/* Quadrant heatmap */}
            {showHeatmap && (
              <div style={cardStyle}>
                <p style={h2Style}>Quadranten</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                  {heatmapRows.flat().map(({ key, label, color }) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>{label}</span>
                        <span>{qCounts[key]}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${(qCounts[key] / maxQ) * 100}%`, background: color, borderRadius: 3, opacity: 0.65 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body state patterns */}
            {bodyPatterns.length > 0 && (
              <div style={cardStyle}>
                <p style={h2Style}>Muster</p>
                {bodyPatterns.map((p, i) => (
                  <p key={i} style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-display)', lineHeight: 1.5, marginBottom: i < bodyPatterns.length - 1 ? 10 : 0 }}>
                    💭 {p}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
