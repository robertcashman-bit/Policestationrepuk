# Station contact research — continuous improvement (Phases 4–7)

Extends the existing custody discovery system with **main-line / provenance research**.
Does **not** replace custody discovery. Does **not** send FOI requests. Does **not**
write `data/stations.json` automatically.

Related: [station-contacts-ops.md](./station-contacts-ops.md), [custody-discovery-ops.md](./custody-discovery-ops.md), [station-contacts-phase1-audit.md](./station-contacts-phase1-audit.md).

## Safe defaults

| Flag | Default | Meaning |
|------|---------|---------|
| `STATION_RESEARCH_ENABLED` | off | Master switch for cron |
| `STATION_RESEARCH_DRY_RUN` | on | Queue candidates only; no public writes |
| `STATION_MAINLINE_RESEARCH_ENABLED` | off | Main-line phone research stage |
| `STATION_RESEARCH_AUTO_PUBLISH` | off | Even when on, v1 still defers to admin queue |

## Pipeline

```text
Priority queue (missing phone / missing source / stale)
  → Official force contact pages (allowlisted .police.uk / .gov.uk)
  → Web search abstraction (Serper / Brave / Bing)
  → Deterministic phone extraction + context classification
  → Confidence + autonomy level decision
  → Dry-run report + KV candidates (admin review)
  → Next recheck schedule
```

Custody numbers remain owned by `lib/custody-discovery/*`.

## Cron

| Schedule | Route |
|----------|-------|
| Tuesdays 05:30 UTC | `/api/cron/station-contact-research` |

No-ops when `STATION_RESEARCH_ENABLED` is off (safe to leave scheduled).

## Admin

- `GET /api/admin/station-research` — open candidates + latest run report
- `POST /api/admin/station-research` — `{ candidateId, action: "approve"|"reject" }`

Approved candidates are marked only; apply numbers via existing station-contacts / UpdateStation publish path.

## Manual dry-run

```bash
npx tsx scripts/run-station-contact-research.ts --limit=3 --force
```

## Search providers

`WEB_SEARCH_PROVIDER=serper|brave|bing` (default serper). Configure the matching API key. Custody discovery uses the same abstraction (`lib/web-search/provider.ts`).

## data.police.uk

`lib/station-research/data-police-uk.ts` lists forces / force metadata for discovery. It does not invent station telephone numbers.

## Rollout

1. Keep flags off in production.
2. Run local `--force` dry-runs; review candidate quality.
3. Enable `STATION_RESEARCH_ENABLED=1` + `STATION_MAINLINE_RESEARCH_ENABLED=1` with dry-run still on.
4. Review admin queue for two weeks.
5. Only then consider lowering dry-run / enabling auto-publish paths (still admin-gated in v1).
