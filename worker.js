// Sub Tracker sync API — Cloudflare Worker + KV.
//
// Routes (all under soccer.theiehls.com/api/*):
//   GET  /api/:team/data   → JSON for that team, or the literal `null` if nothing saved yet
//   PUT  /api/:team/data   → replace that team's JSON (requires X-Coach-Token)
//   GET  /api/data         → legacy single-team key (Spring 2026 Thunder data), read-only
//
// :team is a slug like `boys` or `girls`; each maps to KV key `team:<slug>`.
// Tokens: a PUT is accepted if X-Coach-Token matches COACH_TOKEN (shared by all teams)
// or COACH_TOKEN_<SLUG> (e.g. COACH_TOKEN_GIRLS) for a per-team token. Set with
// `wrangler secret put COACH_TOKEN_GIRLS`. Per-team secrets are optional.

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const LEGACY_KEY = 'thunder_v2';

function isValidSchema(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
  if (!Array.isArray(d.roster)) return false;
  if (typeof d.games !== 'object' || d.games === null || Array.isArray(d.games)) return false;
  if (!Array.isArray(d.capLog)) return false;
  if (typeof d.ps !== 'object' || d.ps === null || Array.isArray(d.ps)) return false;
  if (d.schedule !== undefined && !Array.isArray(d.schedule)) return false;
  if (d.cfg !== undefined && (typeof d.cfg !== 'object' || d.cfg === null || Array.isArray(d.cfg))) return false;
  return true;
}

function tokenOk(env, slug, token) {
  if (!token) return false;
  if (env.COACH_TOKEN && token === env.COACH_TOKEN) return true;
  const perTeam = env['COACH_TOKEN_' + slug.toUpperCase().replace(/-/g, '_')];
  return !!perTeam && token === perTeam;
}

const ALLOWED_ORIGINS = [
  'https://soccer.theiehls.com',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Coach-Token',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const json = (body, status = 200) => new Response(body, {
      status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
    const text = (body, status) => new Response(body, { status, headers: cors });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');

    // Legacy single-team endpoint: read-only so old bookmarks/devices still see spring data.
    if (path === '/data') {
      if (request.method === 'GET') return json((await env.KV.get(LEGACY_KEY)) ?? 'null');
      return text('Gone — use /api/<team>/data', 410);
    }

    const m = path.match(/^\/([^/]+)\/data$/);
    if (m) {
      const slug = m[1];
      if (!SLUG_RE.test(slug)) return text('Bad Request', 400);
      const key = 'team:' + slug;

      if (request.method === 'GET') return json((await env.KV.get(key)) ?? 'null');

      if (request.method === 'PUT') {
        if (!tokenOk(env, slug, request.headers.get('X-Coach-Token'))) return text('Unauthorized', 401);
        let body, data;
        try {
          body = await request.text();
          if (body.length > 500_000) return text('Payload Too Large', 413);
          data = JSON.parse(body);
        } catch {
          return text('Bad Request', 400);
        }
        if (!isValidSchema(data)) return text('Bad Request', 400);
        await env.KV.put(key, body);
        return text('OK', 200);
      }
      return text('Method Not Allowed', 405);
    }

    return text('Not Found', 404);
  },
};
