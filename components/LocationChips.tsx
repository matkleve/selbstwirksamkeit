'use client'

import { Fragment, useEffect, useState } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { AddChip, FilledChip } from '@/components/EntityChip'
import { LocationChipEditor } from '@/components/LocationChipEditor'
import { resolveLocationFromGps, type ResolvedGpsLocation } from '@/lib/geolocation'
import { chipGhost } from '@/lib/chip-classes'

export interface LocationGpsMeta {
  gps: string
  resolved: string
}

interface Props {
  locations: string[]
  onLocationsChange: (locations: string[]) => void
  gpsMeta: LocationGpsMeta | null
  onGpsMetaChange: (meta: LocationGpsMeta | null) => void
  suggestions: string[]
  chipInput: string
  onChipInputChange: (v: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Skip auto GPS (e.g. user dismissed this session). */
  gpsAutoDisabled: boolean
  onGpsAutoDisabledChange: (disabled: boolean) => void
}

export function LocationChips({
  locations,
  onLocationsChange,
  gpsMeta,
  onGpsMetaChange,
  suggestions,
  chipInput,
  onChipInputChange,
  open,
  onOpenChange,
  gpsAutoDisabled,
  onGpsAutoDisabledChange,
}: Props) {
  const [fetchingGps, setFetchingGps] = useState(false)

  useEffect(() => {
    if (gpsAutoDisabled || open || locations.length > 0 || gpsMeta) return
    setFetchingGps(true)
    resolveLocationFromGps().then((result: ResolvedGpsLocation | null) => {
      if (result) {
        onLocationsChange([result.label])
        onGpsMetaChange({ gps: result.gps, resolved: result.resolved })
      }
      setFetchingGps(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when auto-GPS may apply
  }, [gpsAutoDisabled, open, locations.length, gpsMeta])

  const addLocation = (v: string) => {
    const t = v.trim()
    if (!t) return
    onGpsMetaChange(null)
    onLocationsChange(locations.includes(t) ? locations : [...locations, t])
    onChipInputChange('')
  }

  const removeAt = (index: number) => {
    const next = locations.filter((_, j) => j !== index)
    onLocationsChange(next)
    if (index === 0) onGpsMetaChange(null)
    if (next.length === 0) onGpsAutoDisabledChange(true)
  }

  return (
    <Fragment>
      {locations.map((v, i) => (
        <FilledChip
          key={`location-${i}-${v}`}
          icon={MapPin}
          value={v}
          onClear={() => removeAt(i)}
        />
      ))}
      {open ? (
        <div
          className="inline-flex"
          onBlur={e => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return
            onChipInputChange('')
            onOpenChange(false)
          }}
        >
          <LocationChipEditor
            value={chipInput}
            onChange={onChipInputChange}
            onAdd={addLocation}
            onClose={() => {
              onChipInputChange('')
              onOpenChange(false)
            }}
            suggestions={suggestions}
            existingValues={locations}
          />
        </div>
      ) : locations.length > 0 ? (
        <button
          type="button"
          className={chipGhost}
          onClick={() => onOpenChange(true)}
          aria-label="Weiteren Ort hinzufügen"
        >
          <MapPin size={15} strokeWidth={1.75} className="shrink-0" aria-hidden />
          <Plus size={14} strokeWidth={2} className="shrink-0 opacity-55" aria-hidden />
        </button>
      ) : fetchingGps ? (
        <span className={chipGhost} aria-busy="true">
          <MapPin size={15} strokeWidth={1.75} className="shrink-0 opacity-55" aria-hidden />
          <span>…</span>
        </span>
      ) : (
        <AddChip icon={MapPin} label="Ort" onClick={() => onOpenChange(true)} />
      )}
    </Fragment>
  )
}
