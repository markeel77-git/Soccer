# Sub Tracker — project brief

**Updated 2026-09-12.** Personal project (not Visual Logic work). Youth-soccer substitution
app for two 4v4 U9 teams Mark's family coaches. Live at soccer.theiehls.com; repo
`markeel77-git/Soccer` on GitHub; local clone is this folder.

## What it is

- **Thunder Wolves** (boys, CF09A; renamed from Thunder 2026-09-14) — Mark coaches, Jacob plays. URL `/boys/`.
- **Blue Dolphins** (girls, CF09R) — Haley coaches, Annie plays. URL `/girls/`.
- Root `/` is a team chooser. Each team has its own data record; the two never mix.

## Layout (since 2026-09-12; before that one `index.html` held everything)

| File | Role |
|---|---|
| `boys/index.html`, `girls/index.html` | identical 15-line shells; the folder name is the team slug |
| `markup.js` | the app's HTML as a template literal, injected into `#app` |
| `app.js` | all logic. `TEAM_DEFAULTS` = each team's first-run roster, schedule, tiers, settings |
| `app.css` | styles |
| `worker.js`, `wrangler.toml` | Cloudflare Worker sync API; KV key `team:<slug>` |
| `archive/` | the Spring 2026 single-file app and its final data export — do not edit |

## Data model

- `localStorage` key `subtracker:<slug>`; coach token key `subtracker_coach_token` (shared by both teams, migrated from the old `thunder_coach_token`).
- Cloud: `GET/PUT /api/<slug>/data`. Writes need `X-Coach-Token` = `COACH_TOKEN` secret, or `COACH_TOKEN_<SLUG>` for a per-team token (optional, not set as of 2026-09-12).
- Legacy `GET /api/data` still serves the Spring 2026 Thunder record from KV key `thunder_v2`, read-only.
- Record shape: `{roster, ps, cfg, schedule, capLog, games, gid, _updatedAt}`. Newer `_updatedAt` wins on load.
- Schedule entries store `date` (ISO), `time24`, `arriveMin`, `home`, `opp`, `loc`, `field`; game numbers are derived from date order, so `S.games` is keyed by the stable `id`, not the displayed number.

## Rotation engine (`genRots`)

4 on the field, 10-minute quarters. 7–8 players → 2 slots/quarter; 6 → 3 slots. Rules: nobody
sits two slots in a row; nobody plays three in a row; each tier is spread across the groups —
per-slot cap `ceil(tierSize × 4 / players)` with a matching floor, so 2 rated players split 1+1
and 3 allow 2 together. Exact ties in the equity sort break on a seeded random key (added
2026-09-14) so Reshuffle changes the groups, not just positions; with 8 players the groups are
otherwise locked for the whole game by the alternation rules. With 9+ players the sit-twice rule
relaxes for whoever is owed the fewest appearances.
`TEAM_DEFAULTS` tiers for boys as of 2026-09-12: Top = Jack, Jacob; Bottom = Theo, Ronan;
Dayton, Wells and Mateo unrated (Middle) — Mark to set in Settings → Skill Tiers. Girls: all Middle.

## Ground rules

- No build step. Test locally with `python3 -m http.server 8765` and open `/boys/`. Cloud sync
  shows Offline on localhost by design (worker CORS allows only the production origin).
- Rotation constraints are checked headlessly by evaluating `genRots` out of `app.js` in Node;
  re-run that after any engine change (see the 2026-09-12 session).
- Deploy = `git push origin main` (GitHub Pages) plus `wrangler deploy` (worker; the route is
  declared in `wrangler.toml`). Both are production; Mark confirms before either.
- Cloudflare fronts the site and caches responses for 4 hours, 404s included. The three shells
  reference `app.js`, `markup.js` and `app.css` with a `?v=YYYYMMDDx` query: **bump it in all
  three shells whenever those files change**, or the edge keeps serving the old copy. Never
  request a not-yet-published path on the live domain — that caches the 404 (bitten 2026-09-12).
- Parent contact details are never stored in the app or repo — first names only.
- Skill tiers are shown in Settings only when a coach token is saved in that browser (since
  2026-09-14) so parents can be given the link. Caveat: the tiers still travel in the public
  `GET /api/<slug>/data` JSON — hidden from the UI, not secret from anyone reading the API.
