// pages/api/events.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { names = [], city = 'Chicago' } = req.body || {};
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server missing TICKETMASTER_API_KEY' });

    const eventsMap = new Map();

    // Query Ticketmaster for each artist; keep it lightweight
    for (const raw of names.slice(0, 60)) {
      const name = (raw || '').trim();
      if (!name) continue;

      const params = new URLSearchParams({
        apikey: apiKey,
        city,
        classificationName: 'music',
        keyword: name,
        sort: 'date,asc',
        size: '15',
      });

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
      const r = await fetch(url);
      if (!r.ok) continue;

      const data = await r.json();
      const list = data?._embedded?.events || [];
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
            name,
          date,
          venue: ev._embedded?.venues?.[0]?.name || 'TBA',
          city: ev._embedded?.venues?.[0]?.city?.name || city,
          url: ev.url || '#',
        });
      }
    }

    res.status(200).json({ events: Array.from(eventsMap.values()).slice(0, 150) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'events_error' });
  }
}
