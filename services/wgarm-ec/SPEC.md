# WGARM-EC Specification
## Weighted Generalized Association Rule Mining with Embedding-Clustering

Version 1.0 | RFC 2119 normative language

---

## 1. Definitionen

**Entry** — ein Journaleintrag mit strukturierten Feldern und optionalem Embedding.  
**Cluster** — eine Gruppe semantisch ähnlicher Entries, die als einzelnes Item in ARM behandelt wird.  
**Transaction** — ein Entry übersetzt in eine Menge von diskreten Items für FP-Growth.  
**Rule** — eine Assoziationsregel `{antecedent} → {consequent}` mit Support, Confidence, Lift.  
**Compound Score** — Gewicht eines Entries basierend auf Valenz und Tag-Intensität.

---

## 2. Inputs

Der Algorithmus MUST folgende Felder pro Entry verarbeiten können:

```
REQUIRED:
  id:          string
  created_at:  timestamp (voller Zeitstempel, kein Truncating)
  grid_x:      float (-1.0 bis +1.0)  Valenz
  grid_y:      float (-1.0 bis +1.0)  Arousal

OPTIONAL aber RECOMMENDED:
  mood_tags:   string[]               Person, Ort, Gefühl, Aktivität
  hour_of_day: int (0–23)
  day_of_week: int (0–6)
  embedding:   float[1024]            Mistral mistral-embed (see docs/specs/embeddings.md)
  text:        string                 Originaltext
```

Der Algorithmus MUST auch ohne Embeddings lauffähig sein (Phase 1 Fallback).  
Ohne Embeddings MUST Schritt 1 (Clustering) übersprungen werden.

---

## 3. Compound Score

Jeder Entry MUST einen Compound Score erhalten bevor er in eine Transaction übersetzt wird:

```
compound_score = valence_sign × |grid_x| × (1 + len(mood_tags) × 0.2)

valence_sign = sign(grid_x)   # +1 oder -1

Beispiele:
  grid_x=-0.7, 2 Tags → -0.7 × 1.4 = -0.98  (stark negativ)
  grid_x=+0.1, 1 Tag  → +0.1 × 1.2 = +0.12  (fast neutral)
  grid_x=+0.8, 3 Tags → +0.8 × 1.6 = +1.28  (stark positiv)
```

Entries mit |compound_score| < 0.1 MAY von der Analyse ausgeschlossen werden.

---

## 4. Schritt 1 — Semantic Clustering (nur mit Embeddings)

### 4.1 Algorithmus

Der Clustering-Algorithmus MUST online (inkrementell) arbeiten — kein k-Means mit vorher festgelegtem k.

```
Für jeden Entry (chronologisch sortiert):
  1. Berechne cosine_similarity(entry.embedding, cluster.centroid)
     für alle existierenden Cluster
  2. Wenn max_similarity > threshold:
     → Entry tritt dem Cluster bei
     → centroid = (centroid × n + embedding) / (n + 1)  [gleitender Durchschnitt]
  3. Wenn kein Cluster über threshold:
     → Neuer Cluster mit centroid = entry.embedding
```

### 4.2 Threshold

Der Threshold MUST konfigurierbar sein. Default: **0.73**.  
Threshold MUST NOT < 0.60 sein (zu breite Cluster).  
Threshold SHOULD NOT > 0.85 sein (zu enge Cluster bei kleinen Datasets).

### 4.3 Cluster Metadata

Jeder Cluster MUST folgende Metadaten führen:

```typescript
SemanticCluster {
  id:              string          // "C1", "C2", ...
  centroid:        float[]         // gleitender Durchschnitt der Embeddings
  member_ids:      string[]        // alle Entry-IDs
  member_count:    int
  label:           string          // einmal generiert (LLM oder Freitext der anchor entries)
  valence_avg:     float           // Durchschnitt grid_x aller Members
  first_seen:      timestamp
  last_seen:       timestamp
  time_span_days:  int
  anchor_entry_ids: string[]       // 2-3 repräsentativste Entries (höchste avg. Similarity)
}
```

### 4.4 Anchor Entries

Anchor Entries MUST die 2-3 Entries sein mit der höchsten durchschnittlichen Cosine-Similarity zu allen anderen Cluster-Members.  
Sie MUST NOT automatisch die chronologisch ersten oder letzten Entries sein.

---

## 5. Schritt 2 — Transaction Building

Jeder Entry MUST zu einer Transaction übersetzt werden.  
Eine Transaction ist eine Menge diskreten Items.

```
Items aus Embedding (wenn Clustering durchgeführt):
  "cluster:{cluster_id}"     z.B. "cluster:C1"

Items aus grid_x (Valenz-Bucket):
  grid_x < -0.3  → "valence:negativ"
  grid_x > +0.3  → "valence:positiv"
  sonst          → "valence:neutral"

Items aus mood_tags:
  jeder Tag → "tag:{wert}"   z.B. "tag:Mum", "tag:zuhause"

Items aus hour_of_day:
  0–5    → "time:nacht"
  6–11   → "time:morgen"
  12–16  → "time:mittag"
  17–21  → "time:abend"
  22–23  → "time:spaet"

Items aus day_of_week:
  0–4    → "weekday:woche"
  5–6    → "weekday:weekend"
```

Jedes Item MUST das Format `"{namespace}:{wert}"` haben.  
Valenz-Items (valence:*) MUST als mögliches Consequent behandelt werden.  
Alle anderen Items MUST als mögliche Antecedents behandelt werden.

---

## 6. Schritt 3 — FP-Growth

### 6.1 Parameter

```
min_support:    0.15  (mindestens 15% aller Entries — bei kleinem N: min. 2 absolute Vorkommen)
min_confidence: 0.60
min_lift:       1.30  (Regeln unter 1.3 MUST verworfen werden — zu nahe an Zufall)
```

Parameter MUST konfigurierbar sein.

### 6.2 Consequent-Einschränkung

Regeln MUST in der Form `{nicht-valenz items} → {valenz item}` stehen.  
Andere Consequents (z.B. `{valenz} → {tag}`) SHOULD ignoriert werden.  
Grund: Wir suchen Bedingungen die Valenz vorhersagen, nicht umgekehrt.

---

## 7. Schritt 4 — Temporale Annotation

Jede Regel MUST temporale Metadaten erhalten:

```typescript
TemporalMetadata {
  entry_ids:              string[]
  first_seen:             timestamp
  last_seen:              timestamp
  span_days:              int        // last - first
  occurrence_count:       int        // Anzahl matching Entries
  natural_interval_days:  float      // Durchschnitt der Abstände zwischen Vorkommen
  is_escalating:          boolean    // Abstände werden kürzer?
}

is_escalating = true wenn:
  erste Hälfte der Intervalle > zweite Hälfte × 0.7
  (Intervalle werden um mehr als 30% kürzer)
```

---

## 8. Schritt 5 — Template Text

Regeln MUST template-basiert in natürliche Sprache übersetzt werden.  
LLM MUST NOT für Rule-Text-Generierung verwendet werden.  
LLM MAY für Cluster-Labels verwendet werden (einmalig pro Cluster).

### 8.1 Template-Matrix

| Antecedent enthält | Consequent | Template |
|---|---|---|
| `cluster:*` | `valence:negativ` | "Das Thema '{label}' taucht seit {weeks} Wochen {count}× auf." |
| `cluster:*` | `valence:positiv` | "'{label}' erscheint seit {weeks} Wochen als positive Kraft — {count}×." |
| `tag:*` (Person) | `valence:negativ` | "Wenn du mit {person} zusammen bist, fühlst du dich in {conf}% der Fälle unwohl." |
| `tag:*` (Person) | `valence:positiv` | "Einträge mit {person} sind in {conf}% der Fälle positiv." |
| `time:*` | `valence:negativ` | "Deine {time}-Einträge zeigen systematisch negativere Zustände." |
| `weekday:*` | `valence:negativ` | "An {day} notierst du häufiger negative Zustände als an anderen Tagen." |
| default | beliebig | "Mir ist aufgefallen: {antecedent} hängt in {conf}% mit {valence} Zuständen zusammen." |

### 8.2 Priorität bei mehreren Antecedents

Wenn eine Regel mehrere Antecedents hat:  
1. Cluster-Item hat Priorität (spezifischstes Template)  
2. Person-Tag hat zweite Priorität  
3. Default wenn nichts passt

---

## 9. Output

```typescript
interface WGARMResult {
  clusters:   SemanticCluster[]
  rules:      AssociationRule[]
  mirror_candidates: MirrorCandidate[]
}

interface AssociationRule {
  antecedent:             string[]
  consequent:             string[]
  support:                float
  confidence:             float
  lift:                   float
  entry_ids:              string[]
  first_seen:             string    // ISO timestamp
  last_seen:              string
  span_days:              int
  occurrence_count:       int
  natural_interval_days:  float
  is_escalating:          boolean
  template_text:          string    // fertig für Mirror
  anchor_entry_ids:       string[]  // 2-3 Einträge für Darstellung
}

interface MirrorCandidate {
  entry_ids:        string[]
  source:           'wgarm_ec'
  signal_strength:  'weak' | 'moderate' | 'strong'
  template_text:    string
  pattern_metadata: object
}
```

### 9.1 Signal Strength

```
strong:   confidence > 0.80 AND lift > 2.0 AND occurrence_count >= 5
moderate: confidence > 0.65 AND lift > 1.5 AND occurrence_count >= 3
weak:     alles andere über den Mindest-Schwellenwerten
```

---

## 10. Was dieser Algorithmus NICHT tut

- MUST NOT positive Gegenbeispiele im Mirror-Kontext zeigen
- MUST NOT Kausalität behaupten (nur Assoziation)
- MUST NOT bei < 10 Entries ausgeführt werden (zu wenig Basis)
- MUST NOT Zeitfenster vordefinieren — die gesamte Entry-History MUST verwendet werden

---

## 11. Bekannte Template-Bugs (MUST fix vor Phase-2-Produktion)

Die aktuelle `generate_text()`-Implementierung hat drei dokumentierte Defekte. Diese MUST behoben sein, bevor WGARM-EC-Output in Mirror angezeigt wird.

### 11.1 Person-Template auf Mood-Tags

**Symptom:** Alle `tag:*`-Antecedents werden als Personennamen behandelt → *„Wenn du mit Müde zusammen bist …"*

**Fix:** Transaction-Build MUST `tag:person:{name}` vs. `tag:mood:{value}` unterscheiden, oder Person-Template nur bei bekannten Entity-Tags anwenden.

### 11.2 Leerer antecedent_str im Default-Template

**Symptom:** Cluster-only-Regeln ohne gesetztes Label → *„Mir ist aufgefallen:  hängt in 100% …"*

**Fix:** Cluster-Label MUST vor Template-Generierung gesetzt sein; sonst Regel MUST NOT als mirror_candidate emittiert werden.

### 11.3 Fehlende Regel-Deduplizierung

**Symptom:** Überlappende Regeln mit identischem/near-identischem Template-Text erscheinen als mehrere Kandidaten.

**Fix:** Vor Persistierung MUST dedupliziert werden — höchster Lift pro `(consequent, template_text)`, oder Superset-Regeln verwerfen.
