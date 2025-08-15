const scopes = ['user-follow-read'].join(' ')

function getAuthUrl() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI
  if (!clientId || !redirectUri) throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: Math.random().toString(36).slice(2),
    show_dialog: 'true'
  })
  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI
  })

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basic}`
    },
    body: params.toString()
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`token exchange failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function fetchFollowedArtists(accessToken, limit = 50, max = 200) {
  let url = `https://api.spotify.com/v1/me/following?type=artist&limit=${limit}`
  const artists = []
  while (url && artists.length < max) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) throw new Error('spotify following fetch failed')
    const data = await res.json()
    for (const a of (data.artists.items || [])) {
      artists.push({ id: a.id, name: a.name })
    }
    url = data.artists?.next || null
  }
  return artists
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  fetchFollowedArtists
}
