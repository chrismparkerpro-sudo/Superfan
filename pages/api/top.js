// pages/api/top.js
import cookie from 'cookie';

const VALID_TYPE = new Set(['artists', 'tracks']);
const VALID_RANGE = new Set(['short_term', 'medium_term', 'long_term']);

export default async function handler(req, res) {
  try {
    const { type = 'artists', time_range = 'medium_term', limit = 25 } = req.query;
    if (!VALID_TYPE.has(type)) return res.status(400).json({ error: 'type must be "artists" or "tracks"' });
    if (!VALID_RANGE.has(time_range)) return res.status(400).json({ error: 'time_range invalid' });

    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.sf_access;
    if (!token) return res.status(401).json({ error: 'not_authed' });

    const url = new URL(`https://api.spotify.com/v1/me/top/${type}`);
    url.searchParams.set('time_range', time_range);
    url.searchParams.set('limit', Math.min(parseInt(limit || '25', 10) || 25, 50)); // Spotify max 50

    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`spotify top fetch failed: ${r.status} ${text}`);
    }
    const data = await r.json();

    let artists = [];
    if (type === 'artists') {
      artists = (data.items || []).map(a => ({ id: a.id, name: a.name }));
    } else {
      // type === 'tracks' → collect primary artist for each track
      const names = new Set();
      for (const t of (data.items || [])) {
        const primary = t?.artists?.[0];
        if (primary?.name) names.add(primary.name);
      }
      artists = Array.from(names).map(n => ({ id: n, name: n }));
    }

    return res.status(200).json({ items: artists });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'top_error' });
  }
}
