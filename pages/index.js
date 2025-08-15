import { useEffect, useState } from 'react'

const CITIES = ['Chicago','New York','Los Angeles','Austin','Nashville','Seattle','San Francisco','Denver','Atlanta','Miami','Boston','Philadelphia','Dallas','Phoenix','Portland']

export default function Home(){
  const [connected, setConnected] = useState(false)
  const [city, setCity] = useState('Chicago')
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    fetch('/api/session').then(r=>r.json()).then(d=> setConnected(!!d.spotifyConnected))
  }, [])

  const connectSpotify = () => window.location.href = '/api/login'

  const loadArtists = async () => {
    setLoading(true); setError('')
    try{
      const r = await fetch('/api/followed')
      if(r.status === 401){ setError('Please connect Spotify first.'); setLoading(false); return; }
      const data = await r.json()
      setArtists((data.items || []).slice(0,100))
    }catch(e){ setError('Could not load artists.') }
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Superfan — Prototype</h1>
        <div>{connected ? <span className="badge">Spotify Connected</span> : <button className="btn secondary" onClick={connectSpotify}>Connect Spotify</button>}</div>
      </div>

      <div className="card">
        <h2>Location</h2>
        <div className="row">
          <select value={city} onChange={e=>setCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="small">Used to illustrate UX for geotargeting (no events in this build).</span>
        </div>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h2>Connect Spotify</h2>
          <p>We’ll read your <strong>followed artists</strong> (scope: <code>user-follow-read</code>).</p>
          {connected ? <span className="small">You’re connected. Load your artists:</span> : <span className="small">Click connect to authorize.</span>}
          <div className="row" style={{marginTop:8}}>
            <button className="btn" onClick={loadArtists} disabled={loading}>{loading ? 'Loading…' : 'Load Followed Artists'}</button>
          </div>
        </div>

        <div className="card">
          <h2>Your Artists (preview)</h2>
          {error && <p className="small" style={{color:'#ff7b7b'}}>{error}</p>}
          {artists.length === 0 ? <p className="small">No artists loaded yet.</p> : (
            <ul className="clean">
              {artists.map(a => <li className="item" key={a.id}>{a.name}</li>)}
            </ul>
          )}
        </div>
      </div>

      <hr />
      <p className="small">Prototype only. No database, no event lookups.</p>

      <footer>© 2025 Superfan</footer>
    </div>
  )
}
