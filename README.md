# Sub Tracker — Soccer Sub Management

A single-page web app for managing youth soccer substitutions and season stats. Team name, code, location, and season are configured in the app's Settings tab — no code changes needed to use it for a new team.

**Live site:** [soccer.theiehls.com](https://soccer.theiehls.com)

---

## Features

- **Schedule** — Full season game list with location, time, jersey color, and status
- **Game Plan** — Mark attendance, auto-generate a balanced rotation, edit individual cells, lock the plan, and record the final score
- **Print Sheet** — Print three coach copies of the sub rotation on a single page, with fillable score boxes
- **Season Stats** — W–L–T record, per-player minutes, position mix, playing-time equity bars, and captain rotation tracking
- **Settings** — Configure team details, manage the roster, set up cloud sync, and export/import data as JSON

## Tech

Pure HTML, CSS, and vanilla JavaScript — no frameworks, no build step, no server required. Data is stored in browser `localStorage` and optionally synced to Cloudflare Workers KV for multi-device access.

## Deployment

Hosted on [GitHub Pages](https://pages.github.com) with a custom domain via CNAME. The cloud sync API is a Cloudflare Worker (`worker.js`) deployed via Wrangler.

## License

MIT — see [LICENSE](LICENSE)
