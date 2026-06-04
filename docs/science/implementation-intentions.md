# Implementation Intentions — Wissenschaftliche Grundlage

## Kernbefund

Gollwitzer (1999): Wenn-Dann-Pläne produzieren moderate bis große Verbesserungen in der Zielerreichung. Mechanismus: mentale Verknüpfung von Cue und Antwort reduziert benötigte Willenskraft.

## Reminder-Design

Pirolli et al. (2017), JMIR:

- Zeit seit letzter Reminder-Bestätigung ist hochsignifikant für Zielerfolg
- Reminder reaktivieren deklarative Gedächtnisrepräsentation der Implementation Intention
- Vollständiger WENN+DANN-Plan nötig für maximale Aktivierung

Wicaksono et al. (2019), Interacting with Computers:

- Plan Reminders vor der Situation wirksamer als Reminders im Moment selbst
- Dependency-Risiko: zu viele Reminders verhindern Automatizität → deshalb Fading und hartes Ablaufdatum

## Self-Compassion

Neff (2023), Annual Review of Psychology:

- Self-compassion effektiverer Motivator als Selbstkritik
- Non-direktive, warme Sprache → bessere Outcomes
- Kein „Du wolltest“ / „Vergiss nicht“ → aktiviert Schuldgefühle statt Plan

## Konsequenz für Notification-Texte

| Phase | Text |
|-------|------|
| Tag 1 | vollständiger Plan (WENN + DANN) |
| Tag 2–3 | nur DANN (Kontext im Gedächtnis) |
| Tag 4+ | Stille (Fading, kein Dependency-Risiko) |

Normative Umsetzung: `docs/specs/intention-reminders.md`, `lib/intentionReminderText.ts`.

## Quellen

- Gollwitzer, P.M. (1999). Implementation intentions. *American Psychologist*, 54(7), 493–503.
- Pirolli et al. (2017). Implementation Intention and Reminder Effects. *JMIR*, 19(11), e397.
- Wicaksono et al. (2019). Investigating the Impact of Adding Plan Reminders. *Interacting with Computers*, 31(2).
- Neff, K.D. (2023). Self-Compassion: Theory, Method, Research. *Annual Review of Psychology*, 74, 193–217.
