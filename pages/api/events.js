// pages/api/events.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();

    const {
      names = [],
      // either coords...
      lat = null,
      lon = null,
      radius = 25,            // miles
      // ...or free text
      locationText = ''
    } = req.body || {};

    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server missing TICKETMASTER_API_KEY' });

    const eventsMap = new Map();

    // Build a base param function for each query
    const buildParams = (keyword) => {
      const p = new URLSearchParams({
        apikey: apiKey,
        classificationName: 'music',
        keyword: keyword,
        sort: 'date,asc',
        size: '15',
      });

      // Prefer lat/long if provided; otherwise use the free-text as 'city' or 'postalCode'
      if (lat != null && lon != null) {
        p.set('latlong', `${lat},${lon}`);
        p.set('radius', String(Math.max(1, Number(radius) || 25)));
        p.set('unit', 'miles');
      } else if (locationText && /\d{5}/.test(locationText)) {
        // simple heuristic: looks like a US ZIP → use postalCode
        p.set('postalCode', locationText.trim());
        p.set('radius', String(Math.max(1, Number(radius) || 25)));
        p.set('unit', 'miles');
      } else if (locationText) {
        // fallback to city string (Ticketmaster matches common city names)
        p.set('city', locationText.trim());
        // Note: city+radius is not supported together; radius only works with geo/zip
      }
      return p;
    };

    for (const raw of names.slice(0, 60)) {
      const name = (raw || '').trim();
      if (!name) continue;

      const params = buildParams(name);
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
          city: ev._embedded?.venues?.[0]?.city?.name || '',
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
