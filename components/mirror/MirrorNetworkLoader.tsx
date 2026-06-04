'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Design coordinate space — geometry is authored at this size, then scaled to display */
const BASE = 480
const LEGACY = 380
const S = BASE / LEGACY

const CX = 190 * S
const CY = 190 * S
const CR = 112

const STEPS = [
  'Lese deine Einträge...',
  'Erkenne Muster...',
  'Gleiche Zeiträume ab...',
  'Bereite deinen Spiegel vor...',
]

const RAW_NODES: [number, number, number][] = [
  [290, 231, 5], [231, 290, 5], [149, 290, 5], [90, 231, 5],
  [90, 149, 5], [149, 90, 5], [231, 90, 5], [290, 149, 5],
  [328, 190, 4], [288, 288, 4], [190, 328, 4], [92, 288, 4],
  [52, 190, 4], [92, 92, 4], [190, 52, 4], [288, 92, 4],
  [352, 190, 3], [271, 330, 3], [109, 330, 3], [28, 190, 3], [109, 50, 3], [271, 50, 3],
  [320, 128, 3], [255, 348, 3], [125, 353, 3], [45, 118, 3], [342, 258, 3],
]

const NODES: [number, number, number][] = RAW_NODES.map(([x, y, r]) => [x * S, y * S, r * 1.12])

const EDGE_DIST_SQ = (92 * S) ** 2
const EDGES: [number, number][] = []
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const dx = NODES[i]![0] - NODES[j]![0]
    const dy = NODES[i]![1] - NODES[j]![1]
    if (dx * dx + dy * dy < EDGE_DIST_SQ) EDGES.push([i, j])
  }
}

const nodeDelay = (i: number) => {
  const [x, y] = NODES[i]!
  return 0.2 + (Math.sqrt((x - CX) ** 2 + (y - CY) ** 2) / (175 * S)) * 1.5
}
const nodeProg = (i: number, t: number) => Math.min(1, Math.max(0, (t - nodeDelay(i)) / 0.4))
const edgeProg = (ei: number, t: number) => {
  const [a, b] = EDGES[ei]!
  return Math.min(1, Math.max(0, (t - Math.max(nodeDelay(a), nodeDelay(b)) - 0.1) / 0.5))
}
const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
const gold = (a: number) => `rgba(200,168,75,${a})`

function computeDisplaySize() {
  const padX = 20
  const reservedY = 52 + 96 + 48
  const maxW = window.innerWidth - padX * 2
  const maxH = window.innerHeight - reservedY
  return Math.round(Math.min(BASE, maxW, maxH))
}

function useDisplaySize() {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' ? computeDisplaySize() : BASE,
  )

  useLayoutEffect(() => {
    setSize(computeDisplaySize())
  }, [])

  useEffect(() => {
    const update = () => setSize(computeDisplaySize())
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return size
}

export function MirrorNetworkLoader({ loadingStep: _loadingStep }: { loadingStep?: number } = {}) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const t0Ref = useRef<number | null>(null)
  const sizeRef = useRef(BASE)
  const [step, setStep] = useState(-1)
  const displaySize = useDisplaySize()

  sizeRef.current = displaySize

  const setupCanvas = useCallback((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')
    if (!ctx) return null
    const size = sizeRef.current
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const unit = size / BASE
    c.width = Math.round(size * DPR)
    c.height = Math.round(size * DPR)
    c.style.width = `${size}px`
    c.style.height = `${size}px`
    ctx.setTransform(DPR * unit, 0, 0, DPR * unit, 0, 0)
    return ctx
  }, [])

  useEffect(() => {
    const c = cvRef.current
    if (!c) return
    t0Ref.current = null
    const ctx = setupCanvas(c)
    if (!ctx) return

    function draw(ts: number) {
      if (!t0Ref.current) t0Ref.current = ts
      const t = (ts - t0Ref.current) / 1000
      ctx.clearRect(0, 0, BASE, BASE)

      EDGES.forEach(([i, j], ei) => {
        const p = ease(edgeProg(ei, t))
        if (!p) return
        ctx.beginPath()
        ctx.moveTo(NODES[i]![0], NODES[i]![1])
        ctx.lineTo(
          NODES[i]![0] + (NODES[j]![0] - NODES[i]![0]) * p,
          NODES[i]![1] + (NODES[j]![1] - NODES[i]![1]) * p,
        )
        ctx.strokeStyle = gold(0.2 * p)
        ctx.lineWidth = 0.7
        ctx.stroke()
      })

      NODES.forEach(([x, y, r], i) => {
        const p = ease(nodeProg(i, t))
        if (!p) return
        const pulse = 1 + 0.07 * Math.sin(t * 2 + i * 0.8)

        ctx.beginPath()
        ctx.arc(x, y, r * 2.2 * p * pulse, 0, Math.PI * 2)
        ctx.fillStyle = gold(0.07 * p)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, r * p * pulse, 0, Math.PI * 2)
        ctx.fillStyle = gold(0.75 * p)
        ctx.fill()
      })

      const cp = Math.min(1, t / 0.4)
      const cpu = 1 + 0.03 * Math.sin(t * 1.4)

      ctx.beginPath()
      ctx.arc(CX, CY, CR * cp, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(242,237,230,${0.94 * cp})`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(CX, CY, CR * cp * cpu, 0, Math.PI * 2)
      ctx.strokeStyle = gold(0.65 * cp)
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(CX, CY, CR * cp * cpu * 0.88, 0, Math.PI * 2)
      ctx.strokeStyle = gold(0.18 * cp)
      ctx.lineWidth = 0.5
      ctx.stroke()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [displaySize, setupCanvas])

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(0), 200),
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const textInset = 10
  const textLeft = ((CX - CR + textInset) / BASE) * 100
  const textTop = ((CY - CR + textInset) / BASE) * 100
  const textSize = ((CR - textInset) * 2 / BASE) * 100
  const fontSize = Math.max(10, Math.min(13, displaySize * 0.026))
  const markSize = Math.max(8, fontSize * 0.78)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)] px-5"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="relative max-h-[min(480px,calc(100dvh-11rem))] max-w-[min(480px,calc(100vw-2.5rem))] shrink-0"
        style={{ width: displaySize, height: displaySize }}
      >
        <canvas ref={cvRef} className="absolute inset-0 block h-full w-full" aria-hidden />
        <div
          className="pointer-events-none absolute flex flex-col items-start justify-center"
          style={{
            left: `${textLeft}%`,
            top: `${textTop}%`,
            width: `${textSize}%`,
            height: `${textSize}%`,
            gap: displaySize < 340 ? 5 : 8,
            paddingLeft: displaySize * 0.018,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex items-center transition-opacity duration-[450ms] ease-out"
              style={{
                gap: displaySize * 0.018,
                opacity: step >= i ? 1 : 0,
                fontSize,
                lineHeight: 1.3,
                color: step > i
                  ? 'var(--muted-foreground, rgba(44,36,24,.4))'
                  : 'var(--foreground, rgba(44,36,24,.82))',
              }}
            >
              <span
                className="shrink-0 text-[rgba(200,168,75,.95)]"
                style={{ fontSize: markSize, width: markSize * 1.35 }}
              >
                {step > i ? '✓' : '·'}
              </span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MirrorNetworkLoader
