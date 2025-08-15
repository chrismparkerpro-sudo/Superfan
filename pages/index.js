// pages/index.js
import { useEffect, useState } from 'react'

const CITIES = [
  'Chicago','New York','Los Angeles','Austin','Nashville',
  'Seattle','San Francisco','Denver','Atlanta','Miami',
  'Boston','Philadelphia','Dallas','Phoenix','Portland'
]

const TIME_RANGES = [
  { label: 'Last 4 weeks', value: 'short_term' },
  { label: 'Last 6 months', value: 'medium_term' },
  { label: 'All-time', value: 'long_term' },
]

export default function Home(){
  const [connected, setConnected] = useState(false)
  const [city, setCity] = useState('Chicago')
  const [source, setSource] = useState('followed') // followed | top_artists | top_tracks
  const [timeRange, setTimeRange] = useState('medium_term')
  const [includeSimilar, setIncludeSimilar] = useState(false)

  const [artists, setArtists] = useState([])
  const [events, setEvents] = useState([])
  const [recommended, setRecommended] = useState([])

  const [busy, setBusy] = useState(false) // unified spinner
  const [error, setError] = useState('')

  useEffect(()=>{
    fetch('/api/session')
      .then(r=>r.json())
      .then(d=> setConnected(!!d.spotifyConnected))
      .catch(()=>{})
  }, [])

  const connectSpotify = () => window.location.href = '/api/login'

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

  const oneClickFind = async () => {
    try {
      setBusy(true)
      setError('')
      setEvents([])
      setRecommended([])

      // 1) ensure artists for current source
      let current = artists
      if (current.length === 0) {
        current = await loadArtistsForSource()
        setArtists(current) // cache for preview
      }
      if (current.length === 0) throw new Error('No artists available.')

      // 2) Ticketmaster search for current artists
      const baseRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ names: current.map(a => a.name), city })
      })
      const baseOut = await baseRes.json()
      if (baseOut.error) throw new Error(baseOut.error)
      let finalEvents = baseOut.events || []

      // 3) optionally include similar artists
      if (includeSimilar) {
        const simRes = await fetch('/api/similar-events', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ seeds: current.map(a => ({ id: a.id, name: a.name })), city })
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
      <div className="header">
        <h1>Superfan — Prototype</h1>
        <div>
          {connected
            ? <span className="badge">Spotify Connected</span>
            : <button className="btn secondary" onClick={connectSpotify}>Connect Spotify</button>}
        </div>
      </div>

      <div className="card">
        <h2>Location & Source</h2>
        <div className="row" style={{marginBottom:8}}>
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="small">City for the event search.</span>
        </div>
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
        </div>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h2>Action</h2>
          <p className="small">
            {source === 'followed'
              ? <>We’ll use your <strong>followed artists</strong> (scope: <code>user-follow-read</code>).</>
              : <>We’ll use your <strong>listening history</strong> (scope: <code>user-top-read</code>) to derive artists.</>
            }
          </p>
          <div className="row" style={{marginTop:8}}>
            <button className="btn" onClick={oneClickFind} disabled={busy}>
              {busy ? 'Finding…' : `Find Shows in ${city}`}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Selected Artists (preview)</h2>
          {artists.length === 0
            ? <p className="small">No artists loaded yet (they’ll load automatically when you search).</p>
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

      <div className="card" style={{marginTop:16}}>
        <h2>Results</h2>
        {error && <p className="small" style={{color:'#ff7b7b'}}>{error}</p>}
        {events.length === 0 ? (
          <p className="small">No results yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Artist</th>
                <th>Date</th>
                <th>Venue</th>
                <th>City</th>
                <th>Tickets</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.artist}</td>
                  <td>{ev.date}</td>
                  <td>{ev.venue}</td>
                  <td>{ev.city}</td>
                  <td>
                    <a className="btn secondary" href={ev.url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr />
      <p className="small">Prototype only. No database; events via Ticketmaster Discovery API.</p>
      <footer>© 2025 Superfan</footer>
    </div>
  )
}
