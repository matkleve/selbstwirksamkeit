# Mirror & Stärke — Erkenntnistypen

Version 1.2 | RFC 2119

Normative companion to `pattern-mirror.md` (detectors, DB) and `wgarm-ec.md` (Phase 2).  
Text helpers: `lib/insightText.ts`. Mirror UI response flow: `MirrorFlow.tsx`.

---

## Grundstruktur jedes Insights

```
NARRATIVE CORE      ← typ-spezifisch
RESPONSE BLOCKS     ← universell, immer gleich
```

---

## Response Blocks — universell

```
[?]  Frage
     Eine einzige offene Frage, typ-spezifisch

[✎]  Reflexion
     Freitext-Textarea
     Placeholder: "..."
     Navigation: Text-Link "→ weiter ohne Antwort"
     MUST NOT: Bestätigung danach — still weitergehen
     Gespeichert in: mirror_sessions.user_response

[✎]  Wenn-Dann
     WENN [leer]   Placeholder: "es 21 Uhr wird · ich heimkomme"
     DANN [leer]   Placeholder: "atme ich dreimal durch"
     Speichern MUST inaktiv bis beide Felder ausgefüllt

[🔔] Reminder
     MUST NOT erscheinen wenn Wenn-Dann leer
     Chips: Heute · 3 Tage · Diese Woche · Lieber nicht
     Reminder block MUST appear only after Weiter on Wenn-Dann (not while typing)
     MUST NOT: Companion-Sprache („Ich melde mich …")

[◎]  Summary
     "Du hast heute hingeschaut. Das zählt."
     MUST immer letzter Block sein
```

**Invarianten:**

```
MUST NOT: Verhaltensempfehlungen
MUST NOT: "Überspringen"-Button gleichwertig zu Weiter
MUST NOT: Reminder ohne Wenn-Dann
MUST NOT: Fanfare oder Bestätigung
MUST:     Stille — einfach weitergehen
```

---

## Hilfs-Funktionen — Text-Bausteine

These functions MUST be used in all templates. Implementation: `lib/insightText.ts`.

### intensity(count)

```
3–5:   "Das taucht immer wieder auf."
6–12:  "Du kennst das gut."
13+:   "Das begleitet dich schon lange."
```

### timespan(span_days)

```
< 60:   "in den letzten Wochen"
< 180:  "seit einigen Monaten"
< 365:  "seit dem {Jahreszeit}"    // Frühling/Sommer/Herbst/Winter
≥ 365:  "seit über einem Jahr"
```

Optional `since` date for season when `span_days` is 180–364.

### seasonFromMonth(month)

```
3–5:    "Frühling"
6–8:    "Sommer"
9–11:   "Herbst"
12,1,2: "Winter"
```

### confidenceText(confidence)

```
> 0.85: "{conf}% der Fälle"
≤ 0.85: "oft"
```

### strongIntro(signal_strength)

```
strong:   "Mir ist etwas aufgefallen.\n\n"  ← vor dem Pattern-Text
moderate: ""                                 ← kein Intro
weak:     ""
```

---

## Insight types (Erkenntnistypen)

| Typ | ID | Algorithms |
|-----|-----|------------|
| Wiederholung | `repetition` | tag_frequency · grid_cluster · time_correlation · weekday_pattern |
| Verwandlung | `transformation` | valence_shift · frequency_change |
| Zusammenhang | `association` | wgarm_ec (person · location · time_valence) |
| Echo | `echo` | temporal_echo · anniversary_echo |
| Bedeutsamer Moment | `significant_moment` | significance_score |

---

## 1. WIEDERHOLUNG

*Das gleiche taucht immer wieder auf.*

**Algorithmen:** tag_frequency · grid_cluster · time_correlation · weekday_pattern

**Narrative Core:**

```
[◦]  strong_intro + Pattern-Text

[❝]  Entry 1 (älteste)

[→]  Übergangstext
     < 14d:   "Kurz darauf."
     < 60d:   "Einen Monat später."
     < 180d:  "{n} Monate später."
     < 365d:  "Ein halbes Jahr später."
     ≥ 365d:  "Fast ein Jahr später."

[❝]  Entry 2

[→]  Übergangstext

[❝]  Entry 3 (neueste)

[◦]  Zusammenfassung: timespan-Text + count
```

**Templates:**

*tag_frequency, positiv (valence_avg > 0.3):*

```
Pattern:         strong_intro + "Deine Einträge {label} klingen meist positiv — " + intensity(count) + " " + timespan(span_days) + "."
Zusammenfassung: "Du hast das {count}× erlebt."
Frage Mirror:    "Fällt dir auf, was diese Momente verbindet?"
Frage Stärke:    "Was macht diese Momente möglich?"
```

*tag_frequency, negativ (valence_avg < -0.3):*

```
Pattern:         strong_intro + "Deine Einträge {label} klingen meist schwer — " + intensity(count) + " " + timespan(span_days) + "."
Zusammenfassung: "Das ist {count}× aufgetaucht."
Frage:           "Fällt dir auf, was diese Momente verbindet?"
```

*tag_frequency, neutral:*

```
Pattern: "In deinen Einträgen erscheint {label} immer wieder — alle ~{interval} Tage."
Frage:   "Was bedeutet das für dich?"
```

*grid_cluster:*

```
Pattern:         strong_intro + "Du kehrst immer wieder zu Momenten zurück, die sich {quadrant_label} anfühlen."
Zusammenfassung: timespan(span_days) + ", {count}×."

Quadrant-Labels:
  pos-self:   "positiv und auf dich bezogen"
  pos-other:  "positiv und anderen zugewandt"
  neg-self:   "schwer und auf dich gerichtet"
  neg-other:  "schwer in Bezug auf andere"

Frage: "Was verbindet diese Momente?"
```

*time_correlation:*

```
Pattern: "Deine {time_label}-Einträge klingen systematisch {adj} als sonst."
         adj: "positiver" | "schwerer"
Frage:   "Überrascht dich das?"
```

*weekday_pattern:*

```
Pattern: "{Wochentag}s schreibst du anders als an anderen Tagen."
Frage:   "Was passiert an {Wochentag}s?"
```

**Erscheint in:** Mirror · Stärke (nur positiv)

---

## 2. VERWANDLUNG

*Dasselbe Thema, aber die Art wie du darüber schreibst hat sich verändert.*

**Algorithmen:** valence_shift · frequency_change

**Narrative Core:**

Standard (< 6 Einträge ODER span_days < 60):

```
[◦]  Einleitung

[❝]  Entry early

[→]  "Und {n} Monate später:"

[❝]  Entry late

[◦]  Pattern-Text (als Schluss)
```

Erweitert (≥ 6 Einträge UND span_days ≥ 60):

```
[◦]  Einleitung

[❝]  Entry early

[→]  "{n} Monate später."

[❝]  Entry middle

[→]  "{n} Monate danach."

[❝]  Entry late

[◦]  Pattern-Text
```

**Templates:**

*valence_shift positiv:*

```
Einleitung:   "Früher klang das so:"
Pattern:      "Etwas hat sich verändert."
Frage Mirror: "Was war das?"
Frage Stärke: "Was hast du verändert?"
```

*valence_shift negativ:*

```
Einleitung: "In ähnlichen Momenten klang das früher so:"
Pattern:    (kein Text — Einträge sprechen selbst)
Frage:      "Was ist passiert?"
```

*frequency_change (häufiger):*

```
Pattern: "Dieses Thema taucht zuletzt öfter auf als " + timespan_relative + "."
Frage:   "Bemerkst du das?"
```

*frequency_change (seltener):*

```
Pattern: "Dieses Thema taucht zuletzt seltener auf als " + timespan_relative + "."
Frage:   "Bemerkst du das?"
```

**Invarianten:**

```
MUST NOT: valence_shift negativ in Stärke
MUST NOT: "Es geht dir besser/schlechter"
MUST:     Mirror zeigt beide Richtungen neutral
```

**Erscheint in:** Mirror (beide) · Stärke (nur positiv)

---

## 3. ZUSAMMENHANG

*Bestimmte Kontexte korrelieren mit bestimmten Zuständen.*

**Algorithmen:** wgarm_ec (person · location · time_valence)

**Narrative Core:**

```
[❝]  Entry 1
     (kein Einleitungstext — Einträge zuerst)

[❝]  Entry 2

[◦]  Pattern-Text mit confidence_text
```

**Templates:** Person/Ort/Zeit — siehe v1.2 examples in project chat; MUST NOT imply causality.

**Erscheint in:** Mirror · Stärke (nur positiv)

---

## 4. ECHO

*Etwas das du geschrieben hast klingt wie etwas das du früher geschrieben hast.*

**Algorithmen:** temporal_echo · anniversary_echo

**Narrative Core:**

```
[◦]  Einleitung (ein Satz, kein Datum)

[❝]  Entry alt

[❝]  Entry neu (nur bei temporal_echo)
     (kein Übergangstext — Datum auf der Karte reicht)
```

**Erscheint in:** Mirror only

---

## 5. BEDEUTSAMER MOMENT

*Ein einzelner Eintrag, der aus dem Rest heraussticht — nicht weil er wiederholt, sondern weil er Gewicht hat.*

**Algorithmus:** `significant_moment` — `significance_score` auf Eintragsebene

**Narrative Core:**

```
[❝]  Entry (der bedeutsame)

[◦]  Pattern-Text (optional, kurz)
```

**Templates:**

```
Pattern:  "Das ist einer deiner Einträge, der besonders hängen geblieben ist."
Frage:    "Was macht diesen Moment bedeutsam für dich?"
```

**Schwellenwerte:**

| Feld | Minimum |
|------|---------|
| `significance_score` | ≥ 0.85 (TBD bei Implementierung) |
| Einträge gesamt | ≥ 5 (Kontext nötig) |
| Alter des Eintrags | ≥ 7 Tage (nicht „gerade eben") |

**Invarianten:**

```
MUST NOT: In Stärke (positiv-only-Kontext passt nicht zu jedem bedeutsamen Moment)
MUST NOT: Bewertung („besonders gut/schlecht")
MUST:     Eigene Worte des Users zeigen — kein interpretierender Overlay-Text
MUST:     Ein Eintrag, nicht eine Serie
```

**Erscheint in:** Mirror only (Implementierung offen)

---

## Schwellenwerte

| Typ | Min. Vorkommen | Min. Span | Weitere |
|---|---|---|---|
| tag_frequency | ≥ 3 | ≥ 14d | — |
| grid_cluster | ≥ 5 | ≥ 14d | Quadrant ≥ 1.5× zweit-häufigster |
| time_correlation | — | — | ≥ 10 Einträge, Δ ≥ 0.3 |
| weekday_pattern | ≥ 3 pro Tag | — | Δ ≥ 0.35 |
| valence_shift | ≥ 4 im Cluster | ≥ 30d | \|shift\| ≥ 0.35 |
| frequency_change | — | — | Faktor ≥ 2× oder ≤ 0.5× |
| wgarm_ec | — | ≥ 14d | **≥ 20 Einträge gesamt**, confidence ≥ 0.65, lift ≥ 1.3, dediziertes Template |
| temporal_echo | — | ≥ 21d | similarity ≥ 0.75 |
| anniversary_echo | — | ≥ 300d | similarity ≥ 0.72, \|Δ365\| < 30 |
| significant_moment | 1 | — | significance_score ≥ 0.85 |

---

## Signal Strength

```
strong:   confidence > 0.80, lift > 2.0, count ≥ 5
moderate: confidence > 0.65, lift > 1.5, count ≥ 3
weak:     alles andere über Mindest-Schwellenwerten
```

Weak SHOULD nur gezeigt werden wenn keine stärkeren vorhanden.

---

## Globale Invarianten

```
MUST NOT: Kausalität
MUST NOT: "Es geht dir besser/schlechter"
MUST NOT: Verhaltensempfehlungen
MUST NOT: Einträge der letzten 7 Tage als Hauptfund
MUST NOT: Mehr als eine Frage pro Insight
MUST:     Eigene Worte des Users zeigen
MUST:     "Kein Muster" als gültiges Ergebnis
```

---

*Pennebaker (1986) · Bandura (1977) · Gollwitzer (1999) · Platon*
