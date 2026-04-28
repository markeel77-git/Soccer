function isValidSchema(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
  if (!Array.isArray(d.roster) || d.roster.length === 0) return false;
  if (typeof d.games !== 'object' || d.games === null || Array.isArray(d.games)) return false;
  if (!Array.isArray(d.capLog)) return false;
  if (typeof d.ps !== 'object' || d.ps === null || Array.isArray(d.ps)) return false;
  return true;
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

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname === '/data' || url.pathname === '/api/data') {

      if (request.method === 'GET') {
        const data = await env.KV.get('thunder_v2');
        return new Response(data ?? 'null', {
          headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }

      if (request.method === 'PUT') {
        const token = request.headers.get('X-Coach-Token');
        if (!token || token !== env.COACH_TOKEN) {
          return new Response('Unauthorized', { status: 401, headers: cors });
        }
        let body, data;
        try {
          body = await request.text();
          if (body.length > 500_000) return new Response('Payload Too Large', { status: 413, headers: cors });
          data = JSON.parse(body);
        } catch {
          return new Response('Bad Request', { status: 400, headers: cors });
        }
        if (!isValidSchema(data)) {
          return new Response('Bad Request', { status: 400, headers: cors });
        }
        await env.KV.put('thunder_v2', body);
        return new Response('OK', { headers: cors });
      }
    }

    return new Response('Not Found', { status: 404, headers: cors });
  },
};
