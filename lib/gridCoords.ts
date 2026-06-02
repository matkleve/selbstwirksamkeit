/** Map grid (−5…+5) to percentage position in the Feld square. */
export function gridPct(x: number, y: number) {
  return { left: ((x + 5) / 10) * 100, top: ((5 - y) / 10) * 100 }
}
