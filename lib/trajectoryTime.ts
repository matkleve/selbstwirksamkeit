import { formatDateEuropean } from '@/lib/utils'

/** Exponential time scale: slider right = recent (fine), left = distant past (coarse). */
const K = 2.6

export function sliderToTime(t: number, firstMs: number, lastMs: number): number {
  if (lastMs <= firstMs) return lastMs
  const u = (Math.exp(K * t) - 1) / (Math.exp(K) - 1)
  return firstMs + u * (lastMs - firstMs)
}

export function timeToSlider(ms: number, firstMs: number, lastMs: number): number {
  if (lastMs <= firstMs) return 1
  const u = (ms - firstMs) / (lastMs - firstMs)
  if (u <= 0) return 0
  if (u >= 1) return 1
  const ek = Math.exp(K)
  return Math.log(u * (ek - 1) + 1) / K
}

export function formatRangeLabel(ms: number): string {
  return formatDateEuropean(ms)
}
