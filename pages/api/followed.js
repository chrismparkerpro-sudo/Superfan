import cookie from 'cookie';

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.sf_access;
    if (!token) return res.status(401).json({ error: 'not_authed' });

    // fetch followed artists, paging up to ~200
    let url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50';
    const items = [];
    while (url && items.length < 200) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`spotify following fetch failed: ${r.status} ${text}`);
      }
      const data = await r.json();
      (data?.artists?.items || []).forEach(a => items.push({ id: a.id, name: a.name }));
      url = data?.artists?.next || null;
    }

    res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'spotify_error' });
  }
}
