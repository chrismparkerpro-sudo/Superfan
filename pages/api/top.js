// pages/api/top.js
import cookie from 'cookie';

const VALID_TYPE = new Set(['artists', 'tracks']);
const VALID_RANGE = new Set(['short_term', 'medium_term', 'long_term']);

export default async function handler(req, res) {
  try {
    const { type = 'artists', time_range = 'medium_term', limit = 25 } = req.query;
    if (!VALID_TYPE.has(type)) return res.status(400).json({ error: 'type must be "artists" or "tracks"' });
    if (!VALID_RANGE.has(time_range)) return res.status(400).json({ error: 'time_range invalid' });

    const token = cookie.parse(req.headers.cookie || '').sf_access;
    if (!token) return res.status(401).json({ error: 'not_authed' });

    const base = `https://api.spotify.com/v1/me/top/${type}`;
    const url = new URL(base);
    url.searchParams.set('time_range', time_range);
    url.searchParams.set('limit', Math.min(parseInt(limit || '25', 10) || 25, 50));

    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`spotify top fetch failed: ${r.status} ${text}`);
    }
    const data = await r.json();

    if (type === 'artists') {
      const items = (data.items || []).map(a => ({
        id: a.id,
        name: a.name,
        image: a.images?.[0]?.url || null,
      }));
      return res.status(200).json({ items });
    }

    // type === 'tracks' → collect primary artist IDs then batch fetch /v1/artists
    const idSet = new Set();
    for (const t of (data.items || [])) {
      const primary = t?.artists?.[0];
      if (primary?.id) idSet.add(primary.id);
    }
    const ids = Array.from(idSet).slice(0, 100); // safety cap

    const chunks = [];
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

    const details = [];
    for (const chunk of chunks) {
      const detailsUrl = new URL('https://api.spotify.com/v1/artists');
      detailsUrl.searchParams.set('ids', chunk.join(','));
      const rr = await fetch(detailsUrl.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!rr.ok) {
        const text = await rr.text();
        throw new Error(`artists batch fetch failed: ${rr.status} ${text}`);
      }
      const j = await rr.json();
      for (const a of (j.artists || [])) {
        details.push({
          id: a.id,
          name: a.name,
          image: a.images?.[0]?.url || null,
        });
      }
    }

    return res.status(200).json({ items: details });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'top_error' });
  }
}
