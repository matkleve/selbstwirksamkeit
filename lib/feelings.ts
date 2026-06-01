import type { LucideIcon } from 'lucide-react'
import {
  Flame,
  AlertCircle,
  Layers,
  Zap,
  Wind,
  Smile,
  Waves,
  Heart,
  Anchor,
  Sparkles,
  Moon,
  BatteryLow,
  Droplet,
  TrendingDown,
  CloudFog,
} from 'lucide-react'
import type { BodyState } from '@/lib/types'

export interface FeelingOption {
  label: string
  bodyState: BodyState
  icon: LucideIcon
}

/** Curated feelings — maps to body_state in DB; no custom entries */
export const FEELINGS: FeelingOption[] = [
  { label: 'gestresst', bodyState: 'stressed', icon: Flame },
  { label: 'ängstlich', bodyState: 'stressed', icon: AlertCircle },
  { label: 'überfordert', bodyState: 'stressed', icon: Layers },
  { label: 'gereizt', bodyState: 'stressed', icon: Zap },
  { label: 'unruhig', bodyState: 'stressed', icon: Wind },
  { label: 'ruhig', bodyState: 'calm', icon: Smile },
  { label: 'entspannt', bodyState: 'calm', icon: Waves },
  { label: 'zufrieden', bodyState: 'calm', icon: Heart },
  { label: 'geerdet', bodyState: 'calm', icon: Anchor },
  { label: 'hoffnungsvoll', bodyState: 'calm', icon: Sparkles },
  { label: 'müde', bodyState: 'tired', icon: Moon },
  { label: 'erschöpft', bodyState: 'tired', icon: BatteryLow },
  { label: 'schlapp', bodyState: 'tired', icon: Droplet },
  { label: 'antriebslos', bodyState: 'tired', icon: TrendingDown },
  { label: 'benommen', bodyState: 'tired', icon: CloudFog },
]

export function feelingBodyState(label: string): BodyState | null {
  return FEELINGS.find(f => f.label === label)?.bodyState ?? null
}

export function feelingIcon(label: string): LucideIcon | undefined {
  return FEELINGS.find(f => f.label === label)?.icon
}
