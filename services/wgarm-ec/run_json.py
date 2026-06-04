#!/usr/bin/env python3
"""Read entries JSON from stdin, run WGARM-EC, print mirror_candidates JSON to stdout."""
from __future__ import annotations

import json
import sys
from datetime import datetime

from algorithm import run_wgarm_ec, Entry


def parse_entry(d: dict) -> Entry:
    raw = d["created_at"].replace("Z", "+00:00")
    dt = datetime.fromisoformat(raw)
    if dt.tzinfo:
        dt = dt.replace(tzinfo=None)
    return Entry(
        id=d["id"],
        created_at=dt,
        grid_x=float(d["grid_x"]),
        grid_y=float(d["grid_y"]),
        mood_tags=d.get("mood_tags") or [],
        hour_of_day=int(d.get("hour_of_day", dt.hour)),
        day_of_week=int(d.get("day_of_week", dt.weekday())),
        text=d.get("text") or "",
        embedding=d.get("embedding"),
    )


def main() -> None:
    data = json.load(sys.stdin)
    entries = [parse_entry(e) for e in data.get("entries", [])]
    result = run_wgarm_ec(entries)

    if "error" in result:
        print(json.dumps({"error": result["error"], "candidates": []}))
        return

    out = []
    for mc in result.get("mirror_candidates", []):
        meta = mc.get("pattern_metadata") or {}
        out.append({
            "entry_ids": mc["entry_ids"],
            "source": mc["source"],
            "signal_strength": mc["signal_strength"],
            "template_text": mc["template_text"],
            "antecedent": meta.get("antecedent", []),
            "consequent": meta.get("consequent", []),
            "confidence": meta.get("confidence"),
            "lift": meta.get("lift"),
            "span_days": meta.get("span_days"),
            "occurrence_count": meta.get("occurrence_count"),
            "anchor_entry_ids": meta.get("anchor_entry_ids", []),
        })

    print(json.dumps({"candidates": out}, ensure_ascii=False))


if __name__ == "__main__":
    main()
