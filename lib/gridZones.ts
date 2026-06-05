// 8-zone quote system: 4 quadrants × mild (dist < 2.5) / strong (dist ≥ 2.5)

export type ZoneKey =
  | 'mild_neg_ich'   | 'strong_neg_ich'
  | 'mild_pos_ich'   | 'strong_pos_ich'
  | 'mild_neg_andere' | 'strong_neg_andere'
  | 'mild_pos_andere' | 'strong_pos_andere'

export function getZone(x: number, y: number): ZoneKey {
  const dist = Math.sqrt(x * x + y * y)
  const strength = dist < 2.5 ? 'mild' : 'strong'
  const xPole = x >= 0 ? 'pos' : 'neg'
  const yPole = y >= 0 ? 'andere' : 'ich'
  return `${strength}_${xPole}_${yPole}` as ZoneKey
}

export const zoneTexts: Record<ZoneKey, string[]> = {
  mild_neg_ich: [
    "Manchmal braucht man Zeit für sich.",
    "Dieser Moment gehört mir.",
    "Ich darf auch einfach sein.",
    "Nicht jeder Tag muss leuchten.",
    "Es ist okay, nicht okay zu sein.",
    "Selbsterkenntnis braucht Stille.",
    "Ich beobachte, ohne zu urteilen.",
    "Schwieriges Terrain — aber vertrautes.",
    "Was dieser Moment mir sagen will.",
    "Ich bin bei mir.",
  ],
  strong_neg_ich: [
    "Das Dunkelste ist auch das Ehrlichste.",
    "Hier ist Raum für das, was wirklich ist.",
    "Dieser Schmerz zeigt mir, wo ich lebe.",
    "Ehrlichkeit zu sich selbst braucht Mut.",
    "Im Tiefsten zeigt sich der Kern.",
    "Ich halte das aus.",
    "Das wird nicht für immer so sein.",
    "Was versucht dieser Moment mir zu zeigen?",
    "Aus der Tiefe kommt die Klarheit.",
    "Auch das ist ein Teil von mir.",
  ],
  mild_pos_ich: [
    "Ein kleiner Schritt nach vorne.",
    "Ich wachse in meinem eigenen Tempo.",
    "Das fühlt sich richtig an.",
    "Ich vertraue meinem Weg.",
    "Zufriedenheit braucht keinen Grund.",
    "Ich merke, wie ich stärker werde.",
    "Dieses Gefühl verdient einen Moment.",
    "Ich tue, was gut für mich ist.",
    "Sanft und sicher.",
    "Jeder Moment zählt.",
  ],
  strong_pos_ich: [
    "Ich spüre meine eigene Kraft.",
    "Das ist, wofür ich arbeite.",
    "Ich bin stolz auf mich.",
    "In meiner Stärke zu Hause.",
    "Selbstwirksamkeit in Reinform.",
    "Ich schaffe, was ich mir vornehme.",
    "Das Beste kommt aus mir selbst.",
    "Ich blühe auf.",
    "Ich vertraue mir vollständig.",
    "Das ist mein Moment.",
  ],
  mild_neg_andere: [
    "Beziehungen sind nie einfach.",
    "Manchmal verstehe ich andere nicht.",
    "Was braucht dieser Mensch wirklich?",
    "Grenzen zu setzen ist auch Liebe.",
    "Ich sehe die Schwierigkeiten — und bleibe.",
    "Nicht jede Verbindung ist leicht.",
    "Auch Reibung kann Wärme erzeugen.",
    "Ich schaue genauer hin.",
    "Miteinander braucht Geduld.",
    "Was wünsche ich mir von dieser Begegnung?",
  ],
  strong_neg_andere: [
    "Das hat mich tief getroffen.",
    "Manchmal enttäuschen Menschen uns.",
    "Was dieser Konflikt über mich sagt.",
    "Ich kann nicht alles tragen.",
    "Manche Wunden brauchen Zeit.",
    "Ich darf wütend sein.",
    "Diese Verletzung ist real.",
    "Ich schütze mich, ohne mich zu schließen.",
    "Schwierige Menschen sind auch Spiegel.",
    "Was ich loslassen möchte.",
  ],
  mild_pos_andere: [
    "Verbundenheit nährt die Seele.",
    "Gemeinsam ist mehr möglich.",
    "Ich sehe das Gute in diesem Menschen.",
    "Eine leichte Begegnung ist ein Geschenk.",
    "Miteinander wachsen.",
    "Andere zeigen mir, wer ich sein kann.",
    "Zusammensein trägt.",
    "Ich schätze, was ich hier erlebe.",
    "Jede gute Begegnung hinterlässt etwas.",
    "Verbindung entsteht in kleinen Momenten.",
  ],
  strong_pos_andere: [
    "Diese Verbindung ist ein Geschenk.",
    "Hier fühle ich mich gesehen.",
    "Liebe und Zugehörigkeit in ihrer schönsten Form.",
    "Zusammen sein bedeutet: Zuhause sein.",
    "Ich bin dankbar für diesen Menschen.",
    "Was mich trägt, bin ich nicht allein.",
    "In dieser Begegnung bin ich ganz.",
    "Vertrauen wächst langsam — und dann mit Macht.",
    "Das Schönste am Leben sind die anderen.",
    "Ich bin verbunden und geborgen.",
  ],
}

// ── Bilinear colour interpolation for card tinting ──
// Pole colours: very desaturated, rendered at 10% opacity via inset box-shadow

export const GRID_POLES = {
  neg_ich:    [185, 100,  72] as const,  // terracotta
  pos_ich:    [ 88, 152, 118] as const,  // sage
  neg_andere: [172, 108, 128] as const,  // dusk rose
  pos_andere: [ 88, 138, 178] as const,  // sky
} as const

const POLES = GRID_POLES

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function lerpRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
}

/** Mild grid values (−2…+2) already lean toward a pole, not only at ±5. */
const AXIS_CURVE = 0.62

function expandAxis(v: number): number {
  const sign = v >= 0 ? 1 : -1
  const mag = Math.min(1, Math.abs(v) / 5)
  return 0.5 + sign * Math.pow(mag, AXIS_CURVE) * 0.5
}

function bilinearFromUnit(tx: number, ty: number): [number, number, number] {
  const bottom = lerpRgb(POLES.neg_ich, POLES.pos_ich, tx)
  const top = lerpRgb(POLES.neg_andere, POLES.pos_andere, tx)
  return lerpRgb(bottom, top, ty)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  return [
    Math.round(hue(h + 1 / 3) * 255),
    Math.round(hue(h) * 255),
    Math.round(hue(h - 1 / 3) * 255),
  ]
}

function poleHueAt(x: number, y: number): number {
  if (x >= 0 && y < 0) return rgbToHsl(...POLES.pos_ich)[0]
  if (x >= 0 && y >= 0) return rgbToHsl(...POLES.pos_andere)[0]
  if (x < 0 && y >= 0) return rgbToHsl(...POLES.neg_andere)[0]
  return rgbToHsl(...POLES.neg_ich)[0]
}

function enrichChroma(rgb: [number, number, number], dist: number, x: number, y: number): [number, number, number] {
  let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
  if (s < 0.08) h = poleHueAt(x, y)
  const nearCenter = dist < 0.22
  const minSat = nearCenter ? 0.34 : 0.2 + (1 - dist) * 0.16
  const mult = 1.28 + (1 - dist) * 0.42
  s = Math.min(0.82, Math.max(minSat, s * mult))
  l = Math.min(0.9, Math.max(0.42, l))
  return hslToRgb(h, s, l)
}

/** Axis-led tint when one dimension is near neutral — avoids grey “cross” at x≈0 or y≈0. */
function axisLeanColor(x: number, y: number): [number, number, number] {
  const ax = Math.abs(x)
  const ay = Math.abs(y)
  if (ax < 0.2 && ay < 0.2) {
    const ich = lerpRgb(POLES.neg_ich, POLES.pos_ich, expandAxis(x || 0.6))
    const andere = lerpRgb(POLES.neg_andere, POLES.pos_andere, expandAxis(y || -0.6))
    return lerpRgb(ich, andere, 0.48)
  }
  if (ax >= ay) {
    return lerpRgb(POLES.neg_ich, POLES.pos_ich, expandAxis(x))
  }
  const ichMid = lerpRgb(POLES.neg_ich, POLES.pos_ich, 0.5)
  const andereMid = lerpRgb(POLES.neg_andere, POLES.pos_andere, 0.5)
  return lerpRgb(ichMid, andereMid, expandAxis(y))
}

/** Valence only (horizontal axis, ich row): terracotta ↔ sage. */
export function gridValenceAxisRgb(x: number): [number, number, number] {
  const tx = expandAxis(x)
  return lerpRgb(POLES.neg_ich, POLES.pos_ich, tx)
}

/** Legacy valence line chart (blue ↔ orange) with axis curve — 50% blend at 0. */
const VALENCE_LINE_NEG: [number, number, number] = [196, 96, 58]
const VALENCE_LINE_POS: [number, number, number] = [59, 125, 216]

export function chartValenceLineRgb(v: number): [number, number, number] {
  return lerpRgb(VALENCE_LINE_NEG, VALENCE_LINE_POS, expandAxis(v))
}

/** Referenz only (vertical axis): ich row ↔ andere row. */
export function gridReferenzAxisRgb(y: number): [number, number, number] {
  const ty = expandAxis(y)
  const ich = lerpRgb(POLES.neg_ich, POLES.pos_ich, 0.5)
  const andere = lerpRgb(POLES.neg_andere, POLES.pos_andere, 0.5)
  return lerpRgb(ich, andere, ty)
}

export function bilinearColor(x: number, y: number): [number, number, number] {
  const tx = expandAxis(x)
  const ty = expandAxis(y)
  const base = bilinearFromUnit(tx, ty)
  const dist = Math.hypot(x / 5, y / 5)

  let rgb = base
  if (dist < 0.58) {
    const lean = axisLeanColor(x, y)
    const t = (0.58 - dist) / 0.58
    rgb = lerpRgb(base, lean, t * 0.72)
  }

  return enrichChroma(rgb, dist, x, y)
}

/** Compose + saved cards — one bilinear wash (matches `cardTintShadow`). */
export const CARD_TINT_OPACITY = 0.22

export function cardTintShadow(
  x: number,
  y: number,
  opacity = CARD_TINT_OPACITY,
): string {
  const [r, g, b] = bilinearColor(x, y)
  return `inset 0 0 0 1000px rgba(${r},${g},${b},${opacity})`
}

/** Soft lift only — no 1px ring (entry cards are borderless). */
export const ENTRY_CARD_DROP_SHADOW = '0 1px 3px rgba(0,0,0,.06)'

/** Compose + saved entry cards — drop shadow + grid tint, no border. */
export function cardBoxShadow(
  x: number,
  y: number,
  opacity = CARD_TINT_OPACITY,
): string {
  return `${ENTRY_CARD_DROP_SHADOW}, ${cardTintShadow(x, y, opacity)}`
}
