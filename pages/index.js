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
  const [artists, setArtists] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)     // load artists
  const [searching, setSearching] = useState(false) // search events
  const [error, setError] = useState('')

  useEffect(()=>{
    fetch('/api/session')
      .then(r=>r.json())
      .then(d=> setConnected(!!d.spotifyConnected))
      .catch(()=>{})
  }, [])

  const connectSpotify = () => window.location.href = '/api/login'

  const loadFollowedArtists = async () => {
    setLoading(true); setError('')
    try{
      const r = await fetch('/api/followed')
      if(r.status === 401){
        setError('Please connect Spotify first.')
        setLoading(false)
        return
      }
      const data = await r.json()
      setArtists((data.items || []).slice(0,100))
    }catch(e){
      setError('Could not load followed artists.')
    }
    setLoading(false)
  }

  const loadTop = async (which) => {
    setLoading(true); setError('')
    try{
      const r = await fetch(`/api/top?type=${which}&time_range=${timeRange}&limit=50`)
      if(r.status === 401){
        setError('Please connect Spotify first.')
        setLoading(false)
        return
      }
      const data = await r.json()
      setArtists((data.items || []).slice(0,100))
    }catch(e){
      setError('Could not load top data.')
    }
    setLoading(false)
  }

  const primeArtistsForSearch = async () => {
    // Ensure we have artists for the selected source
    if (artists.length > 0) return artists

    if (source === 'followed') {
      await loadFollowedArtists()
      return artists
    }
    if (source === 'top_artists') {
      await loadTop('artists')
      return artists
    }
    if (source === 'top_tracks') {
      await loadTop('tracks')
      return artists
    }
    return artists
  }

  const findShows = async () => {
    try {
      setSearching(true)
      setError('')

      // Ensure artists list is populated for selected source
      let current = artists
      if (current.length === 0) {
        await primeArtistsForSearch()
        current = artists
      }
      if (current.length === 0) {
        setError('No artists available. Load artists first.')
        return
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ names: current.map(a => a.name), city })
      })
      const out = await res.json()
      if(out.error){
        setError(out.error)
        setEvents([])
      } else {
        setEvents(out.events || [])
      }
    } catch (e) {
      setError('Show search failed.')
      setEvents([])
    } finally {
      setSearching(false)
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
          <span className="small">
            {source === 'followed'
              ? 'Uses your followed artists.'
              : 'Uses Spotify listening history (user-top-read).'}
          </span>
        </div>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h2>Load Artists</h2>
          <p>
            {source === 'followed'
              ? <>We’ll read your <strong>followed artists</strong> (scope: <code>user-follow-read</code>).</>
              : <>We’ll read your <strong>top {source === 'top_artists' ? 'artists' : 'tracks'}</strong> for the selected period (scope: <code>user-top-read</code>).</>
            }
          </p>
          <div className="row" style={{marginTop:8}}>
            {source === 'followed' ? (
              <button className="btn" onClick={loadFollowedArtists} disabled={loading}>
                {loading ? 'Loading…' : 'Load Followed Artists'}
              </button>
            ) : (
              <button className="btn" onClick={()=>loadTop(source === 'top_artists' ? 'artists' : 'tracks')} disabled={loading}>
                {loading ? 'Loading…' : `Load ${source === 'top_artists' ? 'Top Artists' : 'Top Tracks'}`}
              </button>
            )}
            <button className="btn" onClick={findShows} disabled={searching}>
              {searching ? 'Searching…' : `Find Shows in ${city}`}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Selected Artists (preview)</h2>
          {artists.length === 0
            ? <p className="small">No artists loaded yet.</p>
            : (
              <ul className="clean">
                {artists.map(a => <li className="item" key={a.id || a.name}>{a.name}</li>)}
              </ul>
            )
          }
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
