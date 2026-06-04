"""
WGARM-EC: Weighted Generalized Association Rule Mining with Embedding-Clustering
v1.0 — see SPEC.md for full specification
"""

from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from collections import Counter
from itertools import combinations


# ─── Data Structures ──────────────────────────────────────────────────────────

@dataclass
class Entry:
    id: str
    created_at: datetime
    grid_x: float           # valence -1 to +1
    grid_y: float           # arousal -1 to +1
    mood_tags: List[str] = field(default_factory=list)
    hour_of_day: int = 0
    day_of_week: int = 0    # 0=Mon, 6=Sun
    text: str = ""
    embedding: Optional[List[float]] = None

    @property
    def compound_score(self) -> float:
        sign = 1 if self.grid_x >= 0 else -1
        return sign * abs(self.grid_x) * (1 + len(self.mood_tags) * 0.2)


@dataclass
class SemanticCluster:
    id: str
    centroid: np.ndarray
    member_ids: List[str] = field(default_factory=list)
    member_embeddings: List[np.ndarray] = field(default_factory=list)
    label: str = ""
    valence_sum: float = 0.0
    timestamps: List[datetime] = field(default_factory=list)

    @property
    def member_count(self) -> int:
        return len(self.member_ids)

    @property
    def valence_avg(self) -> float:
        return self.valence_sum / self.member_count if self.member_count else 0.0

    @property
    def first_seen(self) -> Optional[datetime]:
        return min(self.timestamps) if self.timestamps else None

    @property
    def last_seen(self) -> Optional[datetime]:
        return max(self.timestamps) if self.timestamps else None

    @property
    def time_span_days(self) -> int:
        if not self.timestamps or len(self.timestamps) < 2:
            return 0
        return (self.last_seen - self.first_seen).days

    def anchor_entry_ids(self, n: int = 2) -> List[str]:
        """Return n most representative entries (highest avg similarity to all others)."""
        if self.member_count <= n:
            return self.member_ids[:]
        embs = np.array(self.member_embeddings)
        scores = []
        for i, emb in enumerate(embs):
            sims = [cosine_similarity(emb, embs[j]) for j in range(len(embs)) if j != i]
            scores.append((np.mean(sims), self.member_ids[i]))
        scores.sort(reverse=True)
        return [mid for _, mid in scores[:n]]


@dataclass
class AssociationRule:
    antecedent: List[str]
    consequent: List[str]
    support: float
    confidence: float
    lift: float
    entry_ids: List[str] = field(default_factory=list)
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    span_days: int = 0
    occurrence_count: int = 0
    natural_interval_days: float = 0.0
    is_escalating: bool = False
    template_text: str = ""
    anchor_entry_ids: List[str] = field(default_factory=list)

    @property
    def signal_strength(self) -> str:
        if self.confidence > 0.80 and self.lift > 2.0 and self.occurrence_count >= 5:
            return "strong"
        if self.confidence > 0.65 and self.lift > 1.5 and self.occurrence_count >= 3:
            return "moderate"
        return "weak"


# ─── Utilities ────────────────────────────────────────────────────────────────

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


# ─── Step 1: Semantic Clustering ──────────────────────────────────────────────

def build_semantic_clusters(
    entries: List[Entry],
    threshold: float = 0.73
) -> Tuple[List[SemanticCluster], Dict[str, str]]:
    """
    Online incremental clustering.
    Returns: (clusters, entry_id → cluster_id mapping)
    """
    clusters: List[SemanticCluster] = []
    entry_to_cluster: Dict[str, str] = {}

    for entry in sorted(entries, key=lambda e: e.created_at):
        if entry.embedding is None:
            continue

        emb = np.array(entry.embedding)
        best_cluster: Optional[SemanticCluster] = None
        best_sim = threshold

        for cluster in clusters:
            sim = cosine_similarity(emb, cluster.centroid)
            if sim > best_sim:
                best_sim = sim
                best_cluster = cluster

        if best_cluster is None:
            cluster = SemanticCluster(
                id=f"C{len(clusters) + 1}",
                centroid=emb.copy(),
            )
            clusters.append(cluster)
            best_cluster = cluster

        # Update cluster
        n = best_cluster.member_count
        best_cluster.centroid = (best_cluster.centroid * n + emb) / (n + 1)
        best_cluster.member_ids.append(entry.id)
        best_cluster.member_embeddings.append(emb)
        best_cluster.valence_sum += entry.grid_x
        best_cluster.timestamps.append(entry.created_at)
        entry_to_cluster[entry.id] = best_cluster.id

    return clusters, entry_to_cluster


# ─── Step 2: Transaction Building ─────────────────────────────────────────────

def entry_to_transaction(
    entry: Entry,
    cluster_id: Optional[str] = None
) -> List[str]:
    items = []

    if cluster_id:
        items.append(f"cluster:{cluster_id}")

    # Valence bucket
    if entry.grid_x < -0.3:
        items.append("valence:negativ")
    elif entry.grid_x > 0.3:
        items.append("valence:positiv")
    else:
        items.append("valence:neutral")

    # Tags
    for tag in entry.mood_tags:
        items.append(f"tag:{tag.lower()}")

    # Time of day
    h = entry.hour_of_day
    if h < 6:
        items.append("time:nacht")
    elif h < 12:
        items.append("time:morgen")
    elif h < 17:
        items.append("time:mittag")
    elif h < 22:
        items.append("time:abend")
    else:
        items.append("time:spaet")

    # Day type
    items.append("weekday:weekend" if entry.day_of_week >= 5 else "weekday:woche")

    return items


# ─── Step 3: FP-Growth (small-N implementation) ───────────────────────────────

def find_frequent_itemsets(
    transactions: List[List[str]],
    min_support: float = 0.15,
    max_itemset_size: int = 3
) -> Dict[frozenset, float]:
    """
    Returns dict: frozenset(items) → support
    """
    n = len(transactions)
    min_count = max(2, int(min_support * n))
    t_sets = [frozenset(t) for t in transactions]

    # Count all items
    item_counts = Counter(item for t in t_sets for item in t)
    frequent_items = {item for item, cnt in item_counts.items() if cnt >= min_count}

    frequent: Dict[frozenset, float] = {}

    # Generate itemsets up to max_itemset_size
    for size in range(1, max_itemset_size + 1):
        for combo in combinations(sorted(frequent_items), size):
            fs = frozenset(combo)
            count = sum(1 for t in t_sets if fs.issubset(t))
            if count >= min_count:
                frequent[fs] = count / n

    return frequent


def generate_rules(
    frequent_itemsets: Dict[frozenset, float],
    min_confidence: float = 0.60,
    min_lift: float = 1.30,
    valence_items: frozenset = frozenset({"valence:negativ", "valence:positiv", "valence:neutral"})
) -> List[Dict]:
    """
    Only generates rules where consequent is a valence item.
    """
    rules = []

    for itemset, sup in frequent_itemsets.items():
        if len(itemset) < 2:
            continue

        for valence_item in valence_items:
            if valence_item not in itemset:
                continue

            consequent = frozenset([valence_item])
            antecedent = itemset - consequent

            if not antecedent:
                continue

            ant_sup = frequent_itemsets.get(antecedent)
            if ant_sup is None or ant_sup == 0:
                continue

            cons_sup = frequent_itemsets.get(consequent, 0)
            confidence = sup / ant_sup
            lift = confidence / cons_sup if cons_sup > 0 else 0

            if confidence >= min_confidence and lift >= min_lift:
                rules.append({
                    "antecedent": sorted(antecedent),
                    "consequent": [valence_item],
                    "support": round(sup, 3),
                    "confidence": round(confidence, 3),
                    "lift": round(lift, 2),
                })

    # Sort by lift descending
    rules.sort(key=lambda r: r["lift"], reverse=True)
    return rules


# ─── Step 4: Temporal Annotation ──────────────────────────────────────────────

def annotate_rule(
    rule: Dict,
    entries: List[Entry],
    entry_to_cluster: Dict[str, str],
    clusters: List[SemanticCluster]
) -> AssociationRule:
    """Find entries matching the rule's antecedent and annotate temporally."""

    antecedent_set = set(rule["antecedent"])

    # Build transactions per entry to find matching ones
    matching = []
    for entry in entries:
        cid = entry_to_cluster.get(entry.id)
        t = set(entry_to_transaction(entry, cid))
        if antecedent_set.issubset(t):
            matching.append(entry)

    dates = sorted([e.created_at for e in matching])
    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]

    span_days = (dates[-1] - dates[0]).days if len(dates) > 1 else 0
    natural_interval = round(sum(intervals) / len(intervals), 1) if intervals else 0.0

    is_escalating = False
    if len(intervals) >= 3:
        mid = len(intervals) // 2
        first_avg = sum(intervals[:mid]) / mid
        second_avg = sum(intervals[mid:]) / (len(intervals) - mid)
        is_escalating = second_avg < first_avg * 0.70

    # Find anchor entries from matching
    cluster_ids_in_ant = [i.split(":")[1] for i in rule["antecedent"] if i.startswith("cluster:")]
    anchor_ids: List[str] = []
    if cluster_ids_in_ant:
        for c in clusters:
            if c.id in cluster_ids_in_ant:
                anchor_ids = c.anchor_entry_ids(2)
    if not anchor_ids and matching:
        anchor_ids = [matching[0].id, matching[-1].id] if len(matching) > 1 else [matching[0].id]

    ar = AssociationRule(
        antecedent=rule["antecedent"],
        consequent=rule["consequent"],
        support=rule["support"],
        confidence=rule["confidence"],
        lift=rule["lift"],
        entry_ids=[e.id for e in matching],
        first_seen=dates[0] if dates else None,
        last_seen=dates[-1] if dates else None,
        span_days=span_days,
        occurrence_count=len(matching),
        natural_interval_days=natural_interval,
        is_escalating=is_escalating,
        anchor_entry_ids=anchor_ids,
    )
    return ar


# ─── Step 5: Template Text ────────────────────────────────────────────────────

def generate_text(rule: AssociationRule, clusters: List[SemanticCluster]) -> str:
    ant = rule.antecedent
    cons = rule.consequent[0] if rule.consequent else ""
    conf_pct = int(rule.confidence * 100)
    weeks = round(rule.span_days / 7, 1)
    count = rule.occurrence_count

    # Find cluster label
    label = ""
    for item in ant:
        if item.startswith("cluster:"):
            cid = item.split(":")[1]
            for c in clusters:
                if c.id == cid:
                    label = c.label
                    break

    # Find person tags
    persons = [i.split(":")[1].capitalize() for i in ant if i.startswith("tag:")]

    # Find time
    time_items = [i.split(":")[1] for i in ant if i.startswith("time:")]
    weekday_items = [i.split(":")[1] for i in ant if i.startswith("weekday:")]

    escalation_note = " Die Häufigkeit nimmt zu." if rule.is_escalating else ""

    if label and cons == "valence:negativ":
        return (f"Das Thema \"{label}\" taucht seit {weeks} Wochen "
                f"regelmäßig auf — {count}× beschrieben.{escalation_note}")

    if label and cons == "valence:positiv":
        return (f"\"{label}\" erscheint als wiederkehrende positive Kraft "
                f"— {count}× in {weeks} Wochen.")

    if persons and cons == "valence:negativ":
        p = ", ".join(persons)
        return (f"Wenn du mit {p} zusammen bist, fühlst du dich "
                f"in {conf_pct}% der Fälle unwohl.")

    if persons and cons == "valence:positiv":
        p = ", ".join(persons)
        return f"Einträge mit {p} sind in {conf_pct}% der Fälle positiv."

    if time_items and cons == "valence:negativ":
        return (f"Deine {time_items[0]}-Einträge zeigen systematisch "
                f"negativere Zustände als zu anderen Tageszeiten.")

    if weekday_items and cons == "valence:negativ":
        w = "am Wochenende" if weekday_items[0] == "weekend" else "unter der Woche"
        return f"Du notierst {w} häufiger negative Zustände ({conf_pct}% der Fälle)."

    # Default
    ant_str = ", ".join(a for a in ant if not a.startswith("cluster:"))
    valence_str = "negativen" if cons == "valence:negativ" else "positiven"
    return (f"Mir ist aufgefallen: {ant_str} hängt in {conf_pct}% "
            f"der Fälle mit {valence_str} Zuständen zusammen.")


# ─── Main Pipeline ────────────────────────────────────────────────────────────

def run_wgarm_ec(
    entries: List[Entry],
    cluster_threshold: float = 0.73,
    min_support: float = 0.15,
    min_confidence: float = 0.60,
    min_lift: float = 1.30,
) -> Dict:
    """
    Full WGARM-EC pipeline.
    Returns dict with clusters, rules, mirror_candidates.
    """
    if len(entries) < 10:
        return {"error": "Zu wenig Einträge (min. 10 erforderlich)", "clusters": [], "rules": []}

    # Step 1: Clustering
    has_embeddings = any(e.embedding is not None for e in entries)
    clusters, entry_to_cluster = (
        build_semantic_clusters(entries, cluster_threshold)
        if has_embeddings else ([], {})
    )

    # Step 2: Transactions
    transactions = []
    transaction_entry_ids = []
    for entry in entries:
        cid = entry_to_cluster.get(entry.id)
        t = entry_to_transaction(entry, cid)
        transactions.append(t)
        transaction_entry_ids.append(entry.id)

    # Step 3: FP-Growth
    frequent_itemsets = find_frequent_itemsets(transactions, min_support)
    raw_rules = generate_rules(frequent_itemsets, min_confidence, min_lift)

    # Step 4 + 5: Annotate + Text
    rules: List[AssociationRule] = []
    for raw in raw_rules:
        rule = annotate_rule(raw, entries, entry_to_cluster, clusters)
        rule.template_text = generate_text(rule, clusters)
        rules.append(rule)

    # Build mirror_candidates
    mirror_candidates = [
        {
            "entry_ids": r.entry_ids,
            "source": "wgarm_ec",
            "signal_strength": r.signal_strength,
            "template_text": r.template_text,
            "pattern_metadata": {
                "antecedent": r.antecedent,
                "consequent": r.consequent,
                "support": r.support,
                "confidence": r.confidence,
                "lift": r.lift,
                "span_days": r.span_days,
                "occurrence_count": r.occurrence_count,
                "natural_interval_days": r.natural_interval_days,
                "is_escalating": r.is_escalating,
                "anchor_entry_ids": r.anchor_entry_ids,
            }
        }
        for r in rules
    ]

    return {
        "clusters": clusters,
        "rules": rules,
        "mirror_candidates": mirror_candidates,
        "stats": {
            "entries": len(entries),
            "clusters": len(clusters),
            "frequent_itemsets": len(frequent_itemsets),
            "rules": len(rules),
        }
    }
