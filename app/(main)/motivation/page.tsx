import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Entry, BodyState } from '@/lib/types'
import Link from 'next/link'

const ENTRY_SELECT = 'id,user_id,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at'

export default async function MotivationPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase.from('entries').select(ENTRY_SELECT).order('created_at', { ascending: false })
  const entries = (data ?? []) as Entry[]
  const enough = entries.length >= 5

  // ── Bandura: Mastery Experiences ──
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last7 = entries.filter(e => new Date(e.created_at) >= weekAgo)
  const last30 = entries.filter(e => new Date(e.created_at) >= monthAgo)

  const masteryCount = last7.filter(e => e.grid_x !== null && e.grid_x >= 3).length
  const socialCount  = last7.filter(e => e.grid_x !== null && e.grid_x > 0 && e.grid_y !== null && e.grid_y > 0).length

  // Positive streak
  const sortedDays = [...new Set(entries.map(e => e.created_at.slice(0, 10)))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  for (let i = 0; i < sortedDays.length; i++) {
    const d = new Date(sortedDays[i] + 'T12:00:00')
    const expected = new Date(now)
    expected.setDate(now.getDate() - i)
    if (d.toDateString() === expected.toDateString()) streak++
    else break
  }

  // Random positive entry from last 30 days
  const posEntries = last30.filter(e => e.grid_x !== null && e.grid_x >= 2)
  const inspiration = posEntries.length ? posEntries[Math.floor(Math.random() * posEntries.length)] : null

  // ── Pattern insights ──
  const bodyGroups: Record<string, { sum: number; count: number }> = {}
  entries.forEach(e => {
    if (e.body_state && e.grid_x !== null) {
      if (!bodyGroups[e.body_state]) bodyGroups[e.body_state] = { sum: 0, count: 0 }
      bodyGroups[e.body_state].sum += e.grid_x
      bodyGroups[e.body_state].count++
    }
  })
  const bodyInsight = Object.entries(bodyGroups)
    .filter(([, v]) => v.count >= 3)
    .map(([state, v]) => ({ state: state as BodyState, avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg)[0]

  const stateLabel = (s: BodyState) => s === 'stressed' ? 'gestresst' : s === 'calm' ? 'ruhig' : 'müde'

  // Time of day patterns
  const timeGroups: Record<string, { sum: number; count: number }> = { Morgen: { sum: 0, count: 0 }, Mittag: { sum: 0, count: 0 }, Abend: { sum: 0, count: 0 } }
  entries.forEach(e => {
    if (e.grid_x === null) return
    const h = new Date(e.created_at).getHours()
    const label = h < 12 ? 'Morgen' : h < 17 ? 'Mittag' : 'Abend'
    timeGroups[label].sum += e.grid_x
    timeGroups[label].count++
  })
  const bestTime = Object.entries(timeGroups)
    .filter(([, v]) => v.count >= 3)
    .sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0]

  // ACT reframe rate
  const negTotal = entries.filter(e => e.grid_x !== null && e.grid_x < 0).length
  const negWithReframe = entries.filter(e => e.grid_x !== null && e.grid_x < 0 && e.reframe).length

  // ── CBT: Reframe exercise ──
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const reframeCandidate = entries.find(e =>
    e.grid_x !== null && e.grid_x < 0 && !e.reframe &&
    new Date(e.created_at) < threeDaysAgo
  )

  // ── Exercise selection (rotates by day of week) ──
  const recentNeg = last7.filter(e => e.grid_x !== null && e.grid_x < 0).length
  const recentNegOther = last7.filter(e => e.grid_x !== null && e.grid_x < 0 && e.grid_y !== null && e.grid_y > 0).length
  const entryCount = entries.length

  let exercise: { title: string; body: string; source: string } | null = null
  if (entryCount < 5) {
    exercise = {
      title: "Starte deinen Weg",
      body: "Wie geht es dir gerade — in einem einzigen Satz? Geh zur Startseite und trag es ein.",
      source: "Grundlage: Tagebuchtherapie (Pennebaker, 1997)"
    }
  } else if (recentNegOther > recentNeg / 2) {
    exercise = {
      title: "Perspektiv-Wechsel",
      body: "Wähle eine schwierige Begegnung aus dieser Woche. Was könnte die andere Person bewegt haben? Nicht urteilen — nur beobachten.",
      source: "Grundlage: Compassion-focused Therapy (Gilbert, 2009)"
    }
  } else if (recentNeg > last7.length / 2) {
    exercise = {
      title: "Stärken-Inventar",
      body: "Nenne drei Dinge, die du diese Woche gut gemacht hast — egal wie klein. Schreib sie auf oder trag sie als Eintrag ein.",
      source: "Grundlage: Positive Psychology — VIA Character Strengths (Peterson & Seligman, 2004)"
    }
  } else if (streak >= 3) {
    exercise = {
      title: "Dankbarkeit vertiefen",
      body: "Du machst das konsequent. Was hat zu dieser Energie beigetragen? Wer oder was hat dich in dieser Zeit gestärkt?",
      source: "Grundlage: Gratitude Amplification (Emmons & McCullough, 2003)"
    }
  } else {
    exercise = {
      title: "Körper-Check",
      body: "Wie fühlt sich dein Körper gerade an? Nimm 60 Sekunden Zeit. Wo spürst du Spannung, Weite oder Neutrales?",
      source: "Grundlage: Mindfulness-Based Stress Reduction (Kabat-Zinn, 1990)"
    }
  }

  const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: 20, marginBottom: 14 }
  const label: React.CSSProperties = { fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

  return (
    <>
      {/* Bandura: Mastery Moments */}
      <div style={card}>
        <p style={label}>Deine Stärken · Diese Woche</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: inspiration ? 16 : 0 }}>
          {[
            { num: masteryCount, text: 'Starke Momente\n(Valenz ≥ +3)' },
            { num: socialCount,  text: 'Verbindungs-\nmomente' },
            { num: streak,       text: `Tag${streak !== 1 ? 'e' : ''} am Stück\neingetragen` },
          ].map(({ num, text }) => (
            <div key={text} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1 }}>
                {num}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                {text}
              </div>
            </div>
          ))}
        </div>

        {inspiration && (
          <div style={{ marginTop: 4, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4 }}>Erinnerung</p>
            <p style={{ fontSize: '0.9375rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              "{inspiration.text.slice(0, 120)}{inspiration.text.length > 120 ? '…' : ''}"
            </p>
          </div>
        )}
      </div>

      {/* Pattern insights */}
      {enough && (
        <div style={card}>
          <p style={label}>Was deine Daten zeigen</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bodyInsight && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                🧘 Wenn du <strong>{stateLabel(bodyInsight.state)}</strong> bist, liegt dein Durchschnitt bei{' '}
                <strong>{bodyInsight.avg > 0 ? '+' : ''}{bodyInsight.avg.toFixed(1)}</strong> — dein stärkster Körperzustand.
              </p>
            )}
            {bestTime && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                ⏰ Deine positivsten Einträge entstehen meist am <strong>{bestTime[0]}</strong>.
              </p>
            )}
            {negTotal >= 3 && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                💬 Von {negTotal} schwierigen Momenten hast du <strong>{negWithReframe}</strong> davon bereits neu betrachtet
                {' '}({Math.round((negWithReframe / negTotal) * 100)} %).
              </p>
            )}
            {!bodyInsight && !bestTime && negTotal < 3 && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Noch zu wenig Daten für persönliche Muster. Trag weitere Einträge ein.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Research-based exercise */}
      {exercise && (
        <div style={card}>
          <p style={label}>Übung für heute</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 10, margin: '0 0 10px' }}>
            {exercise.title}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
            {exercise.body}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {exercise.source}
          </p>
        </div>
      )}

      {/* CBT: Reframe candidate */}
      {reframeCandidate && (
        <div style={card}>
          <p style={label}>Neuer Blick · Reframe-Übung</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Vor {Math.floor((now.getTime() - new Date(reframeCandidate.created_at).getTime()) / 86400000)} Tagen hast du geschrieben:
          </p>
          <blockquote style={{
            borderLeft: '3px solid var(--valence-neg-mid)',
            paddingLeft: 12, margin: '0 0 14px',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.55,
          }}>
            "{reframeCandidate.text.slice(0, 160)}{reframeCandidate.text.length > 160 ? '…' : ''}"
          </blockquote>
          <Link href="/timeline" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Im Verlauf neu betrachten →
          </Link>
        </div>
      )}

      {!enough && (
        <div style={{ ...card, textAlign: 'center', padding: '36px 24px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.0625rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            "Jeder Eintrag ist ein Datenpunkt auf dem Weg zu dir."
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Ab 5 Einträgen erscheinen personalisierte Erkenntnisse.
          </p>
        </div>
      )}
    </>
  )
}
