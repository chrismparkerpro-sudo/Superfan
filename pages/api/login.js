// pages/api/login.js
export default function handler(req, res) {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        ok: false,
        where: 'login',
        message: 'Missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI in environment',
        got: {
          SPOTIFY_CLIENT_ID: !!clientId,
          SPOTIFY_REDIRECT_URI: redirectUri || null,
        },
      });
    }

    // 👇 add user-top-read (keep user-follow-read for your existing flow)
    const scope = [
      'user-follow-read',
      'user-top-read'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: Math.random().toString(36).slice(2),
      show_dialog: 'true',
    });

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
    return res.redirect(url);
  } catch (e) {
    console.error('Login redirect error:', e);
    return res.status(500).json({ ok: false, where: 'login', message: String(e) });
  }
}
