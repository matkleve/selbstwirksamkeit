"""
Mock test data — realistic enough to test all algorithm paths.
Embeddings are 32-dimensional mock vectors grouped by semantic theme.
"""

import numpy as np
from datetime import datetime, timedelta
from algorithm import Entry

rng = np.random.default_rng(42)

def make_emb(base: np.ndarray, noise: float = 0.08) -> list:
    v = base + rng.normal(0, noise, len(base))
    return (v / np.linalg.norm(v)).tolist()

DIM = 32

# Base vectors for semantic clusters (orthogonalized)
_hunger_base   = rng.normal(0, 1, DIM); _hunger_base /= np.linalg.norm(_hunger_base)
_tired_base    = rng.normal(0, 1, DIM); _tired_base  /= np.linalg.norm(_tired_base)
_proud_base    = rng.normal(0, 1, DIM); _proud_base  /= np.linalg.norm(_proud_base)
_social_base   = rng.normal(0, 1, DIM); _social_base /= np.linalg.norm(_social_base)

START = datetime(2026, 1, 15)

def d(offset_days: int, hour: int = 20) -> datetime:
    return START + timedelta(days=offset_days, hours=hour)

TEST_ENTRIES: list[Entry] = [

    # ── Cluster 1: Hunger / Überfressen (negativ) ─────────────────────────
    Entry("e01", d(0,  21), -0.7, -0.3, ["überfressen"],      21, 2, "hab wieder zu viel gegessen, geht mir schlecht",       make_emb(_hunger_base)),
    Entry("e02", d(5,  20), -0.6, -0.2, ["überfressen"],      20, 0, "könnt jetzt nochmal essen obwohl ich satt bin",         make_emb(_hunger_base)),
    Entry("e03", d(11, 22), -0.8, -0.4, ["überfressen", "frustration"], 22, 6, "schon wieder überfressen, kenn das Muster",   make_emb(_hunger_base)),
    Entry("e04", d(14, 19), -0.5, -0.1, ["überfressen"],      19, 1, "Magen knurrt aber hab trotzdem mehr gegessen",          make_emb(_hunger_base)),
    Entry("e05", d(20, 21), -0.7, -0.3, [],                   21, 0, "bin ausgehungert gewesen und hab's übertrieben",        make_emb(_hunger_base)),
    Entry("e06", d(25, 20), -0.6, -0.2, ["überfressen"],      20, 4, "wieder dieses Gefühl nach dem Essen",                   make_emb(_hunger_base)),
    Entry("e07", d(29, 21), -0.9, -0.5, ["überfressen", "scham"], 21, 1, "warum mach ich das immer wieder",                   make_emb(_hunger_base)),
    Entry("e08", d(33, 19), -0.7, -0.3, [],                   19, 3, "Hunger gehabt und dann gleich alles aufgegessen",       make_emb(_hunger_base)),
    # Escalating: intervals 5,6,3,6,5,4,4 → getting shorter

    # ── Cluster 2: Müdigkeit / Erschöpfung (negativ) ─────────────────────
    Entry("e09", d(2,  23), -0.8, -0.6, ["müde"],             23, 1, "schon wieder so spät wach, morgen wird schwer",         make_emb(_tired_base)),
    Entry("e10", d(7,   9), -0.6, -0.5, ["müde", "erschöpft"], 9, 2, "bin so müde, hab kaum geschlafen",                     make_emb(_tired_base)),
    Entry("e11", d(12, 23), -0.7, -0.4, ["müde"],             23, 1, "es ist wieder so spät geworden",                        make_emb(_tired_base)),
    Entry("e12", d(18, 23), -0.5, -0.3, [],                   23, 3, "total k.o. aber kann nicht einschlafen",                make_emb(_tired_base)),
    Entry("e13", d(24, 22), -0.8, -0.6, ["müde", "frustriert"], 22, 1, "bin fertig heute, alles ist zu viel",                 make_emb(_tired_base)),
    Entry("e14", d(30, 23), -0.6, -0.4, ["müde"],             23, 6, "spät aufgeblieben obwohl ich müde war",                 make_emb(_tired_base)),
    Entry("e15", d(35,  8), -0.4, -0.3, ["müde"],              8, 2, "früh morgens und schon erschöpft",                      make_emb(_tired_base)),

    # ── Cluster 3: Stolz / Leistung (positiv) ────────────────────────────
    Entry("e16", d(3,  18), +0.8, +0.6, ["stolz"],            18, 2, "hab das Projekt fertiggestellt, bin richtig stolz",     make_emb(_proud_base)),
    Entry("e17", d(9,  19), +0.7, +0.5, ["stolz", "motiviert"], 19, 3, "heute produktiv gewesen, alles erledigt",             make_emb(_proud_base)),
    Entry("e18", d(15, 17), +0.9, +0.7, ["stolz"],            17, 1, "früh schlafen gegangen und richtig gut gefühlt",        make_emb(_proud_base)),
    Entry("e19", d(22, 20), +0.6, +0.4, ["motiviert"],        20, 6, "hab Sport gemacht, Energie ist gut",                    make_emb(_proud_base)),
    Entry("e20", d(28, 18), +0.8, +0.6, ["stolz", "motiviert"], 18, 0, "guten Tag, hab viel geschafft",                      make_emb(_proud_base)),
    Entry("e21", d(36, 19), +0.7, +0.5, ["stolz"],            19, 4, "bin zufrieden heute",                                   make_emb(_proud_base)),

    # ── Cluster 4: Soziales mit Person-Tags ──────────────────────────────
    Entry("e22", d(4,  19), -0.6, -0.2, ["mum"],              19, 0, "Abend mit Mum war anstrengend wieder",                  make_emb(_social_base)),
    Entry("e23", d(10, 20), -0.7, -0.3, ["mum", "familie"],   20, 1, "komisches Gefühl nach dem Treffen mit Mum",             make_emb(_social_base)),
    Entry("e24", d(16, 19), -0.5, -0.1, ["mum"],              19, 1, "war bei Mum, bin irgendwie leer danach",                make_emb(_social_base)),
    Entry("e25", d(21, 20), +0.6, +0.4, ["freunde"],          20, 6, "Abend mit Freunden, richtig aufgeladen",                make_emb(_social_base, 0.2)),
    Entry("e26", d(26, 20), -0.6, -0.2, ["mum"],              20, 0, "wieder dieses Gefühl wenn ich von ihr nach Hause fahre",make_emb(_social_base)),
    Entry("e27", d(31, 19), +0.7, +0.5, ["freunde", "Kürnberg"], 19, 0, "Kürnberg-Abend war mega, voll aufgetankt",           make_emb(_social_base, 0.2)),
    Entry("e28", d(37, 20), -0.8, -0.4, ["mum"],              20, 1, "Mum heute wieder komisch, ich weiß nicht",              make_emb(_social_base)),

    # ── Einzelne Einträge (neutral, kein starkes Cluster) ────────────────
    Entry("e29", d(8,  12), +0.2, +0.1, [],                   12, 2, "ganz normaler Tag eigentlich",                          make_emb(_proud_base, 0.5)),
    Entry("e30", d(19, 14), -0.1,  0.0, [],                   14, 3, "meh, weder gut noch schlecht",                          make_emb(_tired_base, 0.5)),
]
