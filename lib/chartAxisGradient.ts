import { bilinearColor, chartValenceLineRgb } from '@/lib/gridZones'

export type ChartAxisGradientMode = 'valence' | 'referenz' | 'valenceChart'

const Y_MIN = -5
const Y_MAX = 5
/** Even step count so one stop lands exactly at y = 0 (50%). */
const STEPS = 16

function axisLineRgb(mode: ChartAxisGradientMode, v: number): [number, number, number] {
  switch (mode) {
    case 'valence':
      return bilinearColor(v, 0)
    case 'referenz':
      return bilinearColor(0, v)
    case 'valenceChart':
      return chartValenceLineRgb(v)
  }
}

function rgbCss([r, g, b]: [number, number, number]): string {
  return `rgb(${r},${g},${b})`
}

/** Stops for Y-axis gradient: offset 0% = +5 (top), 50% = 0, 100% = −5 (bottom). */
export function chartAxisGradientStops(mode: ChartAxisGradientMode): Array<{
  offset: string
  stopColor: string
}> {
  const out: Array<{ offset: string; stopColor: string }> = []
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    const v = Y_MAX - t * (Y_MAX - Y_MIN)
    out.push({
      offset: `${t * 100}%`,
      stopColor: rgbCss(axisLineRgb(mode, v)),
    })
  }
  return out
}
