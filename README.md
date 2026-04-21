# Thunder — Soccer Sub Tracker

A single-page web app for managing youth soccer substitutions and season stats. Built for the **Thunder U9** team (CF09A, Cedar Falls, IA — Spring 2026).

**Live site:** [soccer.theiehls.com](https://soccer.theiehls.com)

---

## Features

- **Game Plan** — Mark attendance, auto-generate a balanced rotation, edit individual cells, lock the plan, and record the final score
- **Print Sheet** — Print three coach copies of the sub rotation on a single page, with fillable score boxes
- **Season Stats** — W–L–T record, per-player minutes, position mix, playing-time equity bars, and captain rotation tracking
- **Schedule** — Full season game list with location, time, jersey color, and status
- **Roster** — Add or remove players; export/import data as JSON for backup or device sync

## Tech

Pure HTML, CSS, and vanilla JavaScript — no frameworks, no build step, no server required. All data is stored in browser `localStorage` and can be exported as JSON.

## Deployment

Hosted on [GitHub Pages](https://pages.github.com) with a custom domain via CNAME.

## License

MIT — see [LICENSE](LICENSE)
