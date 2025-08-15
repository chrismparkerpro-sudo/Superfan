// pages/index.js
import { useEffect, useState } from 'react'

const CITIES = [
  'Chicago','New York','Los Angeles','Austin','Nashville',
  'Seattle','San Francisco','Denver','Atlanta','Miami',
  'Boston','Philadelphia','Dallas','Phoenix','Portland'
]

export default function Home(){
  const [connected, setConnected] = useState(false)
  const [city, setCity] = useState('Chicago')
  const [artists, setArtists] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)     // loading artists
  const [searching, setSearching] = useState(false) // searching events
  const [error, setError] = useState('')

  useEffect(()=>{
    fetch('/api/session')
      .then(r=>r.json())
      .then(d=> setConnected(!!d.spotifyConnected))
      .catch(()=>{})
  }, [])

  const connectSpotify = () => window.location.href = '/api/login'

  const loadArtists = async () => {
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
      setError('Could not load artists.')
    }
    setLoading(false)
  }

  const findShowsFromSpotify = async () => {
    try {
      setSearching(true)
      setError('')
      // Ensure we have artists; if not, load them first
      let current = artists
      if (current.length === 0) {
        const r = await fetch('/api/followed')
        if (r.status === 401) {
          setError('Please connect Spotify first.')
          setSearching(false)
          return
        }
        const data = await r.json()
        current = (data.items || []).slice(0, 100)
        setArtists(current)
      }
      // Call our Ticketmaster proxy
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ names: current.map(a=>a.name), city })
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
        <h2>Location</h2>
        <div className="row">
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="small">Used to search events in this city.</span>
        </div>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h2>Connect Spotify</h2>
          <p>We’ll read your <strong>followed artists</strong> (scope: <code>user-follow-read</code>).</p>
          {connected
            ? <span className="small">You’re connected. Load your artists or search shows:</span>
            : <span className="small">Click connect to authorize.</span>}
          <div className="row" style={{marginTop:8}}>
            <button className="btn" onClick={loadArtists} disabled={loading}>
              {loading ? 'Loading…' : 'Load Followed Artists'}
            </button>
            <button className="btn" onClick={findShowsFromSpotify} disabled={searching}>
              {searching ? 'Searching…' : `Find Shows in ${city}`}
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Your Artists (preview)</h2>
          {artists.length === 0
            ? <p className="small">No artists loaded yet.</p>
            : (
              <ul className="clean">
                {artists.map(a => <li className="item" key={a.id}>{a.name}</li>)}
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
