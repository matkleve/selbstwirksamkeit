'use client'

import { useEffect, useState } from 'react'
import { Cloud, X } from 'lucide-react'
import { WEATHER_LABELS, WEATHER_EMOJI, fetchCurrentWeather } from '@/lib/weather'
import { chipGhost, chipFilled } from '@/lib/chip-classes'
import type { Weather } from '@/lib/types'

interface Props {
  value: Weather | null
  onChange: (v: Weather | null) => void
}

export default function WeatherChip({ value, onChange }: Props) {
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (value !== null) return
    setFetching(true)
    fetchCurrentWeather().then(w => {
      if (w) onChange(w)
      setFetching(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  if (value) {
    return (
      <button type="button" onClick={() => onChange(null)} className={chipFilled}>
        <span aria-hidden className="text-[13px] leading-none">{WEATHER_EMOJI[value]}</span>
        <span>{WEATHER_LABELS[value]}</span>
        <X size={14} strokeWidth={2} className="ml-0.5 shrink-0 opacity-55" aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setFetching(true)
        fetchCurrentWeather().then(w => {
          onChange(w)
          setFetching(false)
        })
      }}
      disabled={fetching}
      className={chipGhost}
      aria-label="Wetter erfassen"
    >
      <Cloud size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <span>{fetching ? '…' : 'Wetter'}</span>
    </button>
  )
}
