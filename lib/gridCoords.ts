/** Keeps the marker dot (+ glow) inside the rounded field at ±5. */
export const GRID_DOT_EDGE_INSET = 8

/** Map grid (−5…+5) to % position with edge inset for markers. */
export function gridPct(x: number, y: number) {
  const span = 100 - 2 * GRID_DOT_EDGE_INSET
  return {
    left: GRID_DOT_EDGE_INSET + ((x + 5) / 10) * span,
    top: GRID_DOT_EDGE_INSET + ((5 - y) / 10) * span,
  }
}
