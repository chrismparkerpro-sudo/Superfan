import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(50);
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);

  const handleConnectSpotify = () => {
    window.location.href = '/api/login';
  };

  const findShows = async () => {
    const res = await fetch(`/api/findShows?location=${encodeURIComponent(location)}&radius=${radius}`);
    const data = await res.json();
    setEvents(data.events || []);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#121212', color: '#fff' }}>
      
      {/* Header with icon + text */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Image
          src="/superfan-icon-light-64.png?v=2"
          alt="Superfan"
          width={40}
          height={40}
          priority
        />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Superfan</h1>
      </header>

      {/* Location and radius inputs */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter city or location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', borderRadius: '5px', border: 'none', width: '200px' }}
        />
        <input
          type="number"
          placeholder="Radius (miles)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', borderRadius: '5px', border: 'none', width: '100px' }}
        />
        <button
          onClick={findShows}
          style={{ padding: '10px 15px', backgroundColor: '#1DB954', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Find Shows
        </button>
      </div>

      {/* Connect to Spotify */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleConnectSpotify}
          style={{ padding: '10px 15px', backgroundColor: '#1DB954', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Connect to Spotify
        </button>
      </div>

      {/* Events Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ borderBottom: '2px solid #1DB954', paddingBottom: '5px' }}>Events Near You</h2>
        {events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.map((event, idx) => (
              <li key={idx} style={{ marginBottom: '15px', background: '#1e1e1e', padding: '10px', borderRadius: '8px' }}>
                <strong>{event.name}</strong> <br />
                {event.date} – {event.venue}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Artists Section */}
      <section>
        <h2 style={{ borderBottom: '2px solid #1DB954', paddingBottom: '5px' }}>Your Artists</h2>
        {artists.length === 0 ? (
          <p>No artists loaded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            {artists.map((artist, idx) => (
              <li key={idx} style={{ background: '#1e1e1e', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <Image
                  src={artist.image}
                  alt={artist.name}
                  width={100}
                  height={100}
                  style={{ borderRadius: '50%' }}
                />
                <p>{artist.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
