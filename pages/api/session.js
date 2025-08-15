import cookie from 'cookie';

export default function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  res.status(200).json({ spotifyConnected: Boolean(cookies.sf_access) });
}
