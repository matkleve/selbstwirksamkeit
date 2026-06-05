'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { MirrorTitle } from '@/components/mirror/MirrorTitle'
import { bilinearColor } from '@/lib/gridZones'

/** Design coordinate space — geometry is authored at this size, then scaled to display */
const BASE = 560
const LEGACY = 380
const S = BASE / LEGACY
/** Max rendered size (desktop); mobile uses nearly full viewport below this */
const MAX_DISPLAY = 600

const CX = 190 * S
const CY = 190 * S
const CR = 112 * (BASE / 480)
/** Radial band for edge fade: near hub → bright, periphery → faint */
const DEPTH_IN = 88 * S
const DEPTH_OUT = 205 * S
const EDGE_ALPHA_NEAR = 0.58
const EDGE_ALPHA_FAR = 0.12
/** Entry card corner radius (--radius-card 0.875rem ≈ 14px at design scale) */
const CARD_R = 14 * S

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

type Rgb = [number, number, number]

interface NetNode {
  x: number
  y: number
  /** Half-width of the inner square (legacy data used circle radius). */
  half: number
  rgb: Rgb
}

function randomGridCoord(): number {
  return Math.random() * 10 - 5
}

function buildNodes(): NetNode[] {
  return RAW_NODES.map(([x, y, r]) => ({
    x: x * S,
    y: y * S,
    half: r * 1.12,
    rgb: bilinearColor(randomGridCoord(), randomGridCoord()),
  }))
}

const NODES = buildNodes()

const EDGE_NEAR_SQ = (118 * S) ** 2
const EDGE_FAR_SQ = (158 * S) ** 2

function edgeKey(i: number, j: number) {
  return i < j ? `${i},${j}` : `${j},${i}`
}

function buildEdges(): [number, number][] {
  const seen = new Set<string>()
  const edges: [number, number][] = []
  const add = (i: number, j: number) => {
    const k = edgeKey(i, j)
    if (seen.has(k)) return
    seen.add(k)
    edges.push([i, j])
  }

  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      const dx = NODES[i]!.x - NODES[j]!.x
      const dy = NODES[i]!.y - NODES[j]!.y
      if (dx * dx + dy * dy < EDGE_NEAR_SQ) add(i, j)
    }
  }

  const degree = new Array(NODES.length).fill(0)
  for (const [i, j] of edges) {
    degree[i]!++
    degree[j]!++
  }

  for (let i = 0; i < NODES.length; i++) {
    const need = Math.max(0, 2 - degree[i]!)
    if (!need) continue
    const neighbors: { j: number; d2: number }[] = []
    for (let j = 0; j < NODES.length; j++) {
      if (i === j) continue
      const dx = NODES[i]!.x - NODES[j]!.x
      const dy = NODES[i]!.y - NODES[j]!.y
      const d2 = dx * dx + dy * dy
      if (d2 < EDGE_FAR_SQ) neighbors.push({ j, d2 })
    }
    neighbors.sort((a, b) => a.d2 - b.d2)
    for (const { j } of neighbors) {
      if (degree[i]! >= 2) break
      const k = edgeKey(i, j)
      if (seen.has(k)) continue
      add(i, j)
      degree[i]!++
      degree[j]!++
    }
  }

  return edges
}

const EDGES = buildEdges()

function edgeDepthAlpha(i: number, j: number): number {
  const na = NODES[i]!
  const nb = NODES[j]!
  const depth = (Math.hypot(na.x - CX, na.y - CY) + Math.hypot(nb.x - CX, nb.y - CY)) * 0.5
  const t = Math.min(1, Math.max(0, (depth - DEPTH_IN) / (DEPTH_OUT - DEPTH_IN)))
  return EDGE_ALPHA_NEAR + (EDGE_ALPHA_FAR - EDGE_ALPHA_NEAR) * t
}

const nodeDelay = (i: number) => {
  const { x, y } = NODES[i]!
  return 0.2 + (Math.sqrt((x - CX) ** 2 + (y - CY) ** 2) / (175 * S)) * 1.5
}
const nodeProg = (i: number, t: number) => Math.min(1, Math.max(0, (t - nodeDelay(i)) / 0.4))
const edgeProg = (ei: number, t: number) => {
  const [a, b] = EDGES[ei]!
  return Math.min(1, Math.max(0, (t - Math.max(nodeDelay(a), nodeDelay(b)) - 0.1) / 0.5))
}
const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

function rgba([r, g, b]: Rgb, a: number) {
  return `rgba(${r},${g},${b},${a})`
}

interface Pt {
  x: number
  y: number
}

function quadAt(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

function trimEndpoints(
  ax: number,
  ay: number,
  ha: number,
  bx: number,
  by: number,
  hb: number,
  pad = 3,
): { p0: Pt; p2: Pt } | null {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy)
  if (len < ha + hb + pad * 2 + 4) return null
  const ux = dx / len
  const uy = dy / len
  const insetA = ha + pad
  const insetB = hb + pad
  return {
    p0: { x: ax + ux * insetA, y: ay + uy * insetA },
    p2: { x: bx - ux * insetB, y: by - uy * insetB },
  }
}

function curveControl(p0: Pt, p2: Pt, ei: number): Pt {
  const mx = (p0.x + p2.x) / 2
  const my = (p0.y + p2.y) / 2
  const dx = p2.x - p0.x
  const dy = p2.y - p0.y
  const len = Math.hypot(dx, dy) || 1
  const bend = Math.min(len * 0.32, 48 * S)
  const cross = dx * (my - CY) - dy * (mx - CX)
  const sign = (cross >= 0 ? 1 : -1) * (ei % 2 === 0 ? 1 : -1)
  return {
    x: mx + (-dy / len) * bend * sign,
    y: my + (dx / len) * bend * sign,
  }
}

function strokeQuadratic(
  ctx: CanvasRenderingContext2D,
  p0: Pt,
  p1: Pt,
  p2: Pt,
  progress: number,
) {
  const steps = 24
  const end = Math.max(1, Math.ceil(steps * progress))
  ctx.beginPath()
  ctx.moveTo(p0.x, p0.y)
  for (let s = 1; s <= end; s++) {
    const t = Math.min(1, (s / steps) * progress)
    const pt = quadAt(p0, p1, p2, t)
    ctx.lineTo(pt.x, pt.y)
  }
  ctx.stroke()
}

function cornerRadiusForHalf(half: number): number {
  return Math.min(CARD_R, half * 0.42)
}

function pathRoundedSquare(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  half: number,
  radius: number,
) {
  const x = cx - half
  const y = cy - half
  const w = half * 2
  const r = Math.min(radius, half * 0.48)
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, w, r)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + w - r)
  ctx.quadraticCurveTo(x + w, y + w, x + w - r, y + w)
  ctx.lineTo(x + r, y + w)
  ctx.quadraticCurveTo(x, y + w, x, y + w - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function readTheme() {
  if (typeof document === 'undefined') {
    return { gold: '#C8A84B', background: '#F5F0EA' }
  }
  const root = getComputedStyle(document.documentElement)
  return {
    gold: root.getPropertyValue('--mirror-gold').trim() || '#C8A84B',
    background: root.getPropertyValue('--background').trim() || '#F5F0EA',
  }
}

function computeDisplaySize() {
  const vv = window.visualViewport
  const vh = vv?.height ?? window.innerHeight
  const vw = vv?.width ?? window.innerWidth
  const narrow = vw < 640
  const padX = narrow ? 14 : 22
  const headerReserve = narrow ? 80 : 100
  const bottomPad = narrow ? 12 : 28
  const maxW = vw - padX * 2
  const maxH = vh - headerReserve - bottomPad
  const fit = Math.min(maxW, maxH, MAX_DISPLAY)
  const floor = narrow ? 268 : 340
  return Math.round(Math.max(floor, fit))
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

export function MirrorNetworkLoader({
  loadingStep: _loadingStep,
  onClose,
}: { loadingStep?: number; onClose?: () => void } = {}) {
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
    const canvasCtx = ctx

    function draw(ts: number) {
      if (!t0Ref.current) t0Ref.current = ts
      const t = (ts - t0Ref.current) / 1000
      const { gold, background } = readTheme()
      canvasCtx.clearRect(0, 0, BASE, BASE)

      const cp = Math.min(1, t / 0.4)
      const cpu = 1 + 0.03 * Math.sin(t * 1.4)
      const hubHalf = CR * cp * cpu

      canvasCtx.strokeStyle = gold
      canvasCtx.lineWidth = 0.75
      canvasCtx.lineCap = 'round'

      EDGES.forEach(([i, j], ei) => {
        const prog = ease(edgeProg(ei, t))
        if (!prog) return
        const na = NODES[i]!
        const nb = NODES[j]!
        const trimmed = trimEndpoints(na.x, na.y, na.half, nb.x, nb.y, nb.half)
        if (!trimmed) return
        const p1 = curveControl(trimmed.p0, trimmed.p2, ei)
        canvasCtx.globalAlpha = edgeDepthAlpha(i, j) * prog
        strokeQuadratic(canvasCtx, trimmed.p0, p1, trimmed.p2, prog)
        canvasCtx.globalAlpha = 1
      })

      NODES.forEach((node, i) => {
        const p = ease(nodeProg(i, t))
        if (!p) return
        const pulse = 1 + 0.07 * Math.sin(t * 2 + i * 0.8)
        const inner = node.half * p * pulse
        const maskHalf = inner + 2.5
        const rMask = cornerRadiusForHalf(maskHalf)
        const rIn = cornerRadiusForHalf(inner)

        pathRoundedSquare(canvasCtx, node.x, node.y, maskHalf, rMask)
        canvasCtx.fillStyle = background
        canvasCtx.fill()

        pathRoundedSquare(canvasCtx, node.x, node.y, inner, rIn)
        canvasCtx.fillStyle = rgba(node.rgb, p)
        canvasCtx.fill()
      })

      const hubR = cornerRadiusForHalf(hubHalf)
      const hubPad = 1.5

      pathRoundedSquare(canvasCtx, CX, CY, hubHalf + hubPad, cornerRadiusForHalf(hubHalf + hubPad))
      canvasCtx.fillStyle = background
      canvasCtx.globalAlpha = 1
      canvasCtx.fill()

      pathRoundedSquare(canvasCtx, CX, CY, hubHalf, hubR)
      canvasCtx.strokeStyle = gold
      canvasCtx.globalAlpha = 0.9 * cp
      canvasCtx.lineWidth = 1
      canvasCtx.stroke()
      canvasCtx.globalAlpha = 1

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
  const fontSize = Math.max(10, Math.min(14, displaySize * 0.027))
  const markSize = Math.max(8, fontSize * 0.78)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-canvas px-3 max-sm:gap-3 max-sm:px-3.5"
      aria-live="polite"
      aria-busy="true"
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="nav-interactive nav-interactive--ink absolute right-4 top-3 z-10 flex size-[34px] items-center justify-center rounded-lg border border-edge max-sm:right-3.5"
          aria-label="Schließen"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      ) : null}
      <MirrorTitle />
      <div
        className="relative w-full max-w-[min(600px,calc(100vw-1.75rem))] shrink-0 max-sm:max-w-[calc(100vw-1.75rem)]"
        style={{
          width: displaySize,
          height: displaySize,
          maxHeight: 'min(600px, calc(100dvh - 5.5rem))',
        }}
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
