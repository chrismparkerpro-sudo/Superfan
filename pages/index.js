// pages/index.js
import { useEffect, useState } from 'react'

const TIME_RANGES = [
  { label: 'Last 4 weeks', value: 'short_term' },
  { label: 'Last 6 months', value: 'medium_term' },
  { label: 'All-time', value: 'long_term' },
]

export default function Home(){
  const [connected, setConnected] = useState(false)

  // Location
  const [locationText, setLocationText] = useState('Chicago, IL')
  const [radius, setRadius] = useState(25)
  const [coords, setCoords] = useState(null) // { lat, lon }
  const [locBusy, setLocBusy] = useState(false)

  // Source + options
  const [source, setSource] = useState('followed') // followed | top_artists | top_tracks
  const [timeRange, setTimeRange] = useState('medium_term')
  const [includeSimilar, setIncludeSimilar] = useState(false)

  // Data
  const [artists, setArtists] = useState([])
  const [events, setEvents] = useState([])
  const [recommended, setRecommended] = useState([])

  // UI
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    fetch('/api/session')
      .then(r=>r.json())
      .then(d=> setConnected(!!d.spotifyConnected))
      .catch(()=>{})
  }, [])

  const connectSpotify = () => window.location.href = '/api/login'

  // Helpers
  const monthShort = (n) => ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][n] || ''
  const parseDateParts = (s) => {
    if (!s) return { mon:'', day:'', time:'' }
    const [d, t] = s.split(' ')
    const [y,m,dd] = d.split('-').map(x=>parseInt(x,10))
    const mon = isFinite(m) ? monthShort(m-1) : ''
    const day = dd || ''
    const time = t ? t.slice(0,5) : ''
    return { mon, day, time }
  }
  const getArtistImage = (name) => {
    const fromA = artists.find(a => a.name?.toLowerCase() === name?.toLowerCase())
    if (fromA?.image) return fromA.image
    const fromR = recommended.find(a => a.name?.toLowerCase() === name?.toLowerCase())
    if (fromR?.image) return fromR.image
    return null
  }

  // Geolocation
  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) { setError('Geolocation not supported.'); return }
    setLocBusy(true); setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: Number(latitude.toFixed(6)), lon: Number(longitude.toFixed(6)) })
        setLocBusy(false)
      },
      (err) => { setLocBusy(false); setError(`Could not get current location: ${err.message}`) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Data loaders
  const loadArtistsForSource = async () => {
    const endpoint =
      source === 'followed'
        ? '/api/followed'
        : `/api/top?type=${source === 'top_artists' ? 'artists' : 'tracks'}&time_range=${timeRange}&limit=50`
    const r = await fetch(endpoint)
    if (r.status === 401) throw new Error('Please connect Spotify first.')
    const data = await r.json()
    return (data.items || []).slice(0, 100)
  }

  // One‑click search
  const oneClickFind = async () => {
    try {
      setBusy(true)
      setError('')
      setEvents([])
      setRecommended([])

      let current = artists
      if (current.length === 0) {
        current = await loadArtistsForSource()
        setArtists(current)
      }
      if (current.length === 0) throw new Error('No artists available.')

      const locationPayload = coords
        ? { lat: coords.lat, lon: coords.lon, radius: Number(radius) || 25 }
        : { locationText: locationText.trim(), radius: Number(radius) || 25 }

      // Base events (Ticketmaster) for current artists
      const baseRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ names: current.map(a => a.name), ...locationPayload })
      })
      const baseOut = await baseRes.json()
      if (baseOut.error) throw new Error(baseOut.error)
      let finalEvents = baseOut.events || []

      // Optionally include similar
      if (includeSimilar) {
        const simRes = await fetch('/api/similar-events', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ seeds: current.map(a => ({ id: a.id, name: a.name })), ...locationPayload })
        })
        const simOut = await simRes.json()
        if (!simOut.error) {
          setRecommended(simOut.similar || [])
          const byId = new Map()
          ;[...finalEvents, ...(simOut.events || [])].forEach(ev => byId.set(ev.id, ev))
          finalEvents = Array.from(byId.values())
        }
      }

      setEvents(finalEvents)
    } catch (e) {
      setError(e.message || 'Show search failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <img
    src="/superfan-icon-light-64.png?v=2"
    width="32"
    height="32"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  />
  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Superfan</span>
</div>

        <div>
          {connected
            ? <span className="badge">Spotify Connected</span>
            : <button className="btn secondary" onClick={connectSpotify}>Connect Spotify</button>}
        </div>
      </div>

      {/* LOCATION (top) */}
      <div className="card">
        <h2>Location</h2>
        <div className="row" style={{marginBottom:8}}>
          <input
            className="input"
            style={{minWidth:260}}
            placeholder="City, State or Postal Code (e.g., Chicago, IL or 60607)"
            value={locationText}
            onChange={e=>{ setLocationText(e.target.value); setCoords(null); }}
            disabled={!!coords}
          />
          <input
            className="input"
            type="number"
            min={1}
            max={250}
            step={1}
            style={{width:120}}
            value={radius}
            onChange={e=>setRadius(e.target.value)}
            title="Search radius in miles"
          />
          <button className="btn secondary" onClick={useCurrentLocation} disabled={locBusy}>
            {locBusy ? 'Locating…' : (coords ? 'Update My Location' : 'Use My Current Location')}
          </button>
          {coords && (
            <span className="small">Using GPS: {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}</span>
          )}
        </div>
      </div>

      {/* SOURCE & SEARCH (top) */}
      <div className="card" style={{marginTop:16}}>
        <h2>Source & Search</h2>
        <div className="row">
          <select value={source} onChange={e=>setSource(e.target.value)}>
            <option value="followed">Followed Artists</option>
            <option value="top_artists">Top Artists</option>
            <option value="top_tracks">Top Tracks → (derive artists)</option>
          </select>
          {source !== 'followed' && (
            <select value={timeRange} onChange={e=>setTimeRange(e.target.value)}>
              {TIME_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
          <label className="small" style={{display:'flex', alignItems:'center', gap:8}}>
            <input
              type="checkbox"
              checked={includeSimilar}
              onChange={e=>setIncludeSimilar(e.target.checked)}
            />
            Include similar artists
          </label>
          <button className="btn" onClick={oneClickFind} disabled={busy}>
            {busy ? 'Finding…' : 'Find Shows'}
          </button>
        </div>
        {error && <p className="small" style={{color:'#ff7b7b', marginTop:8}}>{error}</p>}
      </div>

      {/* RESULTS (now below the controls) */}
      <div className="card" style={{marginTop:16}}>
        <h2>Results</h2>
        {events.length === 0 ? (
          <p className="small">No results yet. Use the controls above to search.</p>
        ) : (
          <div className="eventlist">
            {events.map(ev => {
              const { mon, day, time } = parseDateParts(ev.date)
              const img = getArtistImage(ev.artist)
              return (
                <div className="event" key={ev.id}>
                  <div className="datecol">
                    <div className="mon">{mon}</div>
                    <div className="day">{day}</div>
                  </div>
                  <div className="event-main">
                    {img ? <img className="event-avatar" src={img} alt={ev.artist} /> : <div className="event-avatar" />}
                    <div className="event-lines">
                      <div className="row1">{time ? `Sun • ${time}` : ''}</div>
                      <div className="row2">{ev.city}</div>
                      <div className="row2">{ev.venue}</div>
                      <div className="row3">{ev.artist}</div>
                    </div>
                  </div>
                  <a className="chev" href={ev.url} target="_blank" rel="noreferrer">›</a>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ARTISTS (below results) */}
      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h2>Selected Artists</h2>
          {artists.length === 0
            ? <p className="small">Artists will load automatically when you search.</p>
            : (
              <ul className="clean">
                {artists.map(a => (
                  <li className="item" key={a.id || a.name}>
                    {a.image ? <img className="avatar" src={a.image} alt={a.name} /> : null}
                    {a.name}
                  </li>
                ))}
              </ul>
            )
          }

          {recommended.length > 0 && (
            <>
              <h2 style={{marginTop:16}}>Recommended Similar Artists</h2>
              <ul className="clean">
                {recommended.map(a => (
                  <li className="item" key={a.id || a.name}>
                    {a.image ? <img className="avatar" src={a.image} alt={a.name} /> : null}
                    {a.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <hr />
      <footer>© 2025 Superfan</footer>
    </div>
  )
}
