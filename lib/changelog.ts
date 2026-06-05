export interface ChangelogEntry {
  version: string
  date: string
  title: string
  changes: { kind: 'new' | 'improved' | 'fixed'; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.4.0',
    date: '2026-06',
    title: 'Multi-Tags & Mustererkennung',
    changes: [
      { kind: 'new', text: 'Mehrere Personen, Orte und Tätigkeiten pro Eintrag' },
      { kind: 'new', text: 'Info-Button auf Verlaufskarten zeigt erkannten Mustertyp' },
      { kind: 'improved', text: 'Spiegel-Schaltfläche überlappt nicht mehr den App-Header' },
      { kind: 'improved', text: 'Mustertext für gespeicherte Kandidaten korrekt rekonstruiert' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-02',
    title: 'Verlauf & Übersicht',
    changes: [
      { kind: 'new', text: 'Timeline-Ansicht mit Filteroptionen und Schieberegler' },
      { kind: 'new', text: 'Übersicht mit Trajektorie- und Zeitdiagrammen' },
      { kind: 'new', text: 'Kalender-Heatmap für Eintragsaktivität' },
      { kind: 'improved', text: 'Gefühls-Chip mit Körperzustandsauswahl' },
    ],
  },
  {
    version: '0.2.0',
    date: '2025-11',
    title: 'Spiegel',
    changes: [
      { kind: 'new', text: 'Mustererkennung (WGARM-EC) entdeckt Zusammenhänge in deinen Einträgen' },
      { kind: 'new', text: 'Spiegel-Flow mit narrativer Reflexion und Erinnerungen' },
      { kind: 'new', text: 'Reframe-Funktion nach negativen Einträgen' },
      { kind: 'new', text: 'Verlaufshistorie erkannter Muster' },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-09',
    title: 'Erste Version',
    changes: [
      { kind: 'new', text: 'Einträge mit Stimmungsfeld (Valenz- und Aktivierungsgitter)' },
      { kind: 'new', text: 'Personen-, Orts- und Tätigkeits-Tags' },
      { kind: 'new', text: 'Anmeldung per E-Mail und Passwort' },
      { kind: 'new', text: 'PWA – als App installierbar' },
    ],
  },
]

export const APP_VERSION = CHANGELOG[0].version
