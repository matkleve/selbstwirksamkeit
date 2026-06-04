"""
WGARM-EC Test Runner
Run: python main.py
"""

from algorithm import run_wgarm_ec
from test_data import TEST_ENTRIES

BOLD  = "\033[1m"
CYAN  = "\033[96m"
GREEN = "\033[92m"
RED   = "\033[91m"
YELLOW= "\033[93m"
DIM   = "\033[2m"
RESET = "\033[0m"


def sep(char="─", width=60):
    print(DIM + char * width + RESET)


def main():
    print()
    print(BOLD + CYAN + "╔══════════════════════════════════════════════════════╗" + RESET)
    print(BOLD + CYAN + "║   WGARM-EC — Test Run                                ║" + RESET)
    print(BOLD + CYAN + "╚══════════════════════════════════════════════════════╝" + RESET)
    print()

    result = run_wgarm_ec(
        entries=TEST_ENTRIES,
        cluster_threshold=0.73,
        min_support=0.15,
        min_confidence=0.55,
        min_lift=1.20,
    )

    if "error" in result:
        print(RED + "ERROR: " + result["error"] + RESET)
        return

    stats = result["stats"]

    # ── Step 1: Clusters ──────────────────────────────────────────────────
    print(BOLD + "STEP 1 — Semantic Clustering" + RESET)
    sep()

    clusters = result["clusters"]

    # Auto-label clusters based on most common tags in member entries
    entry_map = {e.id: e for e in TEST_ENTRIES}
    for c in clusters:
        from collections import Counter
        tag_counts = Counter(
            tag for eid in c.member_ids
            for tag in entry_map.get(eid, type('', (), {'mood_tags': []})()).mood_tags
        )
        top = [t for t, _ in tag_counts.most_common(2)]
        c.label = " + ".join(top) if top else f"Cluster {c.id}"

    for c in clusters:
        valence_icon = GREEN + "▲" + RESET if c.valence_avg > 0 else RED + "▼" + RESET
        escalation = ""
        print(f"  {BOLD}{c.id}{RESET}  {c.label or '—':30s}  "
              f"{valence_icon} valenz {c.valence_avg:+.2f}  "
              f"│  {c.member_count} entries  "
              f"│  {c.time_span_days}d span")
        if c.member_count > 0:
            anchor = c.anchor_entry_ids(2)
            print(f"      {DIM}anchors: {', '.join(anchor)}{RESET}")
    print()

    # ── Step 2: Transactions ──────────────────────────────────────────────
    print(BOLD + "STEP 2 — Transactions" + RESET)
    sep()
    print(f"  Built {stats['entries']} transactions")
    print(f"  Frequent itemsets found: {stats['frequent_itemsets']}")
    print()

    # ── Step 3+: Rules ────────────────────────────────────────────────────
    print(BOLD + "STEP 3–5 — Association Rules" + RESET)
    sep()
    print(f"  Rules generated: {stats['rules']}")
    print()

    rules = result["rules"]
    if not rules:
        print(RED + "  Keine Regeln gefunden. "
              "Threshold oder Support senken?" + RESET)
    else:
        for i, rule in enumerate(rules, 1):
            strength_color = (GREEN if rule.signal_strength == "strong"
                              else YELLOW if rule.signal_strength == "moderate"
                              else DIM)
            strength_icon = ("●●●" if rule.signal_strength == "strong"
                             else "●●○" if rule.signal_strength == "moderate"
                             else "●○○")

            cons = rule.consequent[0]
            cons_color = RED if "negativ" in cons else GREEN

            print(f"  {BOLD}Rule {i}{RESET}  "
                  f"{strength_color}{strength_icon} {rule.signal_strength}{RESET}")
            print(f"    {DIM}antecedent:{RESET}  {', '.join(rule.antecedent)}")
            print(f"    {DIM}consequent:{RESET}  {cons_color}{cons}{RESET}")
            print(f"    {DIM}metrics:  {RESET}  "
                  f"support={rule.support:.2f}  "
                  f"confidence={rule.confidence:.0%}  "
                  f"lift={rule.lift:.2f}")
            print(f"    {DIM}temporal: {RESET}  "
                  f"{rule.occurrence_count}× erlebt  │  "
                  f"span: {rule.span_days}d  │  "
                  f"interval: ~{rule.natural_interval_days:.1f}d  │  "
                  f"{'🔺 eskalierend' if rule.is_escalating else '━  stabil'}")
            print()

            # Template text — the mirror output
            print(f"    {BOLD}🪞 Mirror-Text:{RESET}")
            print(f"    {CYAN}»{RESET} {rule.template_text}")
            print()
            sep("·")
            print()

    # ── Mirror Candidates ─────────────────────────────────────────────────
    print(BOLD + "MIRROR CANDIDATES (bereit für Supabase)" + RESET)
    sep()
    strong = sum(1 for r in rules if r.signal_strength == "strong")
    moderate = sum(1 for r in rules if r.signal_strength == "moderate")
    weak = sum(1 for r in rules if r.signal_strength == "weak")
    print(f"  {GREEN}strong:  {strong}{RESET}")
    print(f"  {YELLOW}moderate: {moderate}{RESET}")
    print(f"  {DIM}weak:    {weak}{RESET}")
    print()
    print(DIM + "  Top candidate for Mirror:" + RESET)
    if result["mirror_candidates"]:
        top = result["mirror_candidates"][0]
        print(f"  signal_strength: {top['signal_strength']}")
        print(f"  template_text:   {top['template_text']}")
        print(f"  entries:         {top['entry_ids'][:3]}{'...' if len(top['entry_ids']) > 3 else ''}")
    print()
    print(BOLD + CYAN + "Done." + RESET)
    print()


if __name__ == "__main__":
    main()
