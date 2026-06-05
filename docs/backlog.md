# Backlog & Ideen

Niedrig priorisierte oder noch nicht spezifizierte Feature-Ideen.  
Reife Ideen → in `docs/specs/` überführen, bevor Code entsteht.

---

## Chip-Dropdown: Recents + kontextuelle Websuche

**Kontext:** Person-, Ort- und Tätigkeits-Chips öffnen derzeit einen Inline-Editor
mit Autocomplete aus den Supabase-Tabellen (`persons`, `locations`, `activities`).

**Idee:** Das Dropdown in drei Bereiche aufteilen:

1. **Zuletzt verwendet** — die letzten 3–5 Werte aus der DB für diesen Typ,
   sortiert nach `created_at DESC`, direkt anklickbar ohne zu tippen.
2. **Passendes aus Datenbank** — bisheriger Autocomplete-Filter (bleibt).
3. **Aktionen am Ende des Dropdowns** (immer sichtbar, 2 Einträge):
   - „Im Web suchen: *[getippter Begriff]*" → öffnet z. B. Google Maps / Wikipedia
     zugeschnitten auf den aktuell gespeicherten Ort (aus `locations[0]`)
   - „*[Begriff]* in der Nähe suchen" → nutzt die aktuelle Geolocation der Person
     und sucht z. B. `[Begriff] near me` über die bevorzugte Suchmaschine des Geräts.

**Abhängigkeiten:**
- Geolocation bereits vorhanden (`lib/weather.ts` nutzt sie)
- Supabase-Tabellen bereits vorhanden
- Requires: `DropdownPanel` Erweiterung um eine „Aktion"-Sektion unten

**Offene Fragen:**
- Welche Suchmaschine / welcher URL-Scheme? (Google Maps, OSM, Brave?)
- Soll die Websuche im selben Tab oder in einem neuen Tab öffnen?
- Nur für `location`-Chips oder auch für `person` und `activity`?

---
