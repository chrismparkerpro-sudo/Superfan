import cookie from 'cookie';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { seeds = [], city = 'Chicago' } = req.body || {};

    const token = cookie.parse(req.headers.cookie || '').sf_access;
    if (!token) return res.status(401).json({ error: 'not_authed' });

    const tmKey = process.env.TICKETMASTER_API_KEY;
    if (!tmKey) return res.status(500).json({ error: 'Server missing TICKETMASTER_API_KEY' });

    // 1) Related artists per seed
    const similarMap = new Map();
    const seedIds = seeds.map(s => s.id).filter(Boolean).slice(0, 25);

    for (const id of seedIds) {
      const r = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) continue;
      const data = await r.json();
      for (const a of (data.artists || [])) {
        if (!similarMap.has(a.id)) {
          similarMap.set(a.id, {
            id: a.id,
            name: a.name,
            image: a.images?.[0]?.url || null
          });
        }
      }
    }

    const similar = Array.from(similarMap.values()).slice(0, 60);

    // 2) Ticketmaster search for similar artists
    const eventsMap = new Map();
    for (const a of similar) {
      const params = new URLSearchParams({
        apikey: tmKey,
        city,
        classificationName: 'music',
        keyword: a.name,
        sort: 'date,asc',
        size: '10'
      });
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const list = j?._embedded?.events || [];
      for (const ev of list) {
        const id = ev.id;
        if (!id || eventsMap.has(id)) continue;
        const start = ev.dates?.start;
        const date = start?.localDate
          ? `${start.localDate}${start.localTime ? ' ' + start.localTime : ''}`
          : 'TBA';
        eventsMap.set(id, {
          id,
          artist:
            ev._embedded?.attractions?.[0]?.name ||
            (ev.name?.split(' at ')[0]) ||
            a.name,
          date,
          venue: ev._embedded?.venues?.[0]?.name || 'TBA',
          city: ev._embedded?.venues?.[0]?.city?.name || city,
          url: ev.url || '#',
        });
      }
    }

    res.status(200).json({
      similar,
      events: Array.from(eventsMap.values()).slice(0, 150)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'similar_events_error' });
  }
}
