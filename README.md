# Sub Tracker — Soccer Sub Management

A single-page web app for managing youth soccer substitutions and season stats, for 4v4 games
with four positions and 10-minute quarters. It runs one team per URL path:

| Team | URL | Data key |
|---|---|---|
| Thunder (boys, CF09A) | [soccer.theiehls.com/boys](https://soccer.theiehls.com/boys/) | `team:boys` |
| Blue Dolphins (girls, CF09R) | [soccer.theiehls.com/girls](https://soccer.theiehls.com/girls/) | `team:girls` |

The root URL is a team chooser. Each team keeps its own roster, schedule, skill tiers,
season stats and settings. Everything is edited in the app's Settings tab — no code changes
needed for a new season.

---

## Features

- **Schedule** — Season game list with location, kickoff, arrive time, jersey color and status. Edited in Settings.
- **Game Plan** — Mark attendance, auto-generate a balanced rotation, edit individual cells, lock the plan, record the score, copy a parent email.
- **Print Sheet** — Three coach copies of the sub rotation on one page, plus a phone screenshot view.
- **Season Stats** — W–L–T record, per-player minutes, position mix, playing-time equity, captain rotation.
- **Settings** — Roster, skill tiers, team details (name, code, age group, jerseys, coach, icon), schedule, cloud sync token, export/import, Start New Season, reset.

## Rotation rules

- 8 players: 2 slots per quarter (5:00 each), 4 play / 4 sit. 7 players: 2 slots, one carryover per quarter. 6 players: 3 slots (3:30 / 3:30 / 3:00).
- No player sits two consecutive slots; no player plays three consecutive slots (with 9+ players the first rule relaxes for whoever is owed the fewest appearances).
- Top-tier and Bottom-tier players are spread across the groups: two rated players split one per group, three allow two together (Settings → Skill Tiers).
- Playing time is weighted toward players with fewer season minutes; positions rotate so nobody repeats one in a game.

## Files

```
index.html        team chooser (root)
boys/index.html   shell for /boys  — loads the shared files below
girls/index.html  shell for /girls
markup.js         the app's HTML, injected into <div id="app">
app.js            all logic; TEAM_DEFAULTS holds each team's first-run roster, schedule and settings
app.css           styles
worker.js         Cloudflare Worker sync API (one KV record per team)
wrangler.toml     worker config
archive/          the Spring 2026 single-file app and data exports
```

To add a third team: copy `boys/` to a new folder (the folder name is the team slug), add an entry to
`TEAM_DEFAULTS` in `app.js`, and add a card to `index.html`. The worker needs no change.

## Tech

Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step. Data is stored in browser
`localStorage` (key `subtracker:<team>`) and synced to Cloudflare Workers KV for multi-device access.
Reads are open; writes require the coach token (Settings → Cloud Sync), stored once per browser and
shared by both teams. A per-team token can be added as a `COACH_TOKEN_<SLUG>` worker secret.

## Deployment

Hosted on [GitHub Pages](https://pages.github.com) with a custom domain via CNAME — pushing `main`
deploys the site. The sync API is a Cloudflare Worker deployed with `wrangler deploy` from this folder.

## License

MIT — see [LICENSE](LICENSE)
