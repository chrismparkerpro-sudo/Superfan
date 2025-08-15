import cookie from 'cookie';

export default async function handler(req, res) {
  try {
    const { code, error } = req.query;
    if (error) throw new Error(`Spotify auth error: ${error}`);
    if (!code) throw new Error('Missing "code"');

    // Exchange code for token (HTTP Basic auth)
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    });

    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: params.toString(),
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`token exchange failed: ${r.status} ${text}`);
    }
    const token = await r.json();
    if (!token?.access_token) throw new Error('No access_token from Spotify');

    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    res.setHeader('Set-Cookie', cookie.serialize('sf_access', token.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: token.expires_in || 7200, // 2h default
    }));

    return res.redirect('/');
  } catch (e) {
    console.error('OAuth callback error:', e?.stack || e?.message || e);
    return res.status(500).json({ ok: false, where: 'callback', message: String(e) });
  }
}
