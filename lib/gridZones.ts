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

const POLES = {
  neg_ich:    [186, 144,  82] as const,  // warm ochre
  pos_ich:    [ 72, 168, 158] as const,  // muted teal
  neg_andere: [168, 118, 128] as const,  // dusty mauve
  pos_andere: [140, 120, 188] as const,  // muted violet
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function lerpRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
}

export function bilinearColor(x: number, y: number): [number, number, number] {
  const tx = (x + 5) / 10   // 0 = neg-x side, 1 = pos-x side
  const ty = (y + 5) / 10   // 0 = ich side (y=-5), 1 = andere side (y=+5)
  const bottom = lerpRgb(POLES.neg_ich, POLES.pos_ich, tx)
  const top    = lerpRgb(POLES.neg_andere, POLES.pos_andere, tx)
  return lerpRgb(bottom, top, ty)
}

export function cardTintShadow(x: number, y: number, opacity = 0.10): string {
  const [r, g, b] = bilinearColor(x, y)
  return `inset 0 0 0 1000px rgba(${r},${g},${b},${opacity})`
}
