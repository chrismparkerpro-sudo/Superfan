const { setHttpOnlyCookie } = require('../../lib/cookies')
const { exchangeCodeForToken } = require('../../lib/spotify')

module.exports = async function handler(req, res){
  try{
    const { code, error } = req.query
    if (error) throw new Error(`Spotify auth error: ${error}`)
    if (!code) throw new Error('Missing "code"')

    const token = await exchangeCodeForToken(code)
    if (!token?.access_token) throw new Error('No access_token from Spotify')

    setHttpOnlyCookie(res, 'sf_access', token.access_token, { maxAge: token.expires_in })
    res.redirect('/')
  }catch(e){
    console.error('OAuth callback error:', e?.stack || e?.message || e)
    res.status(500).json({ ok:false, where:'callback', message: String(e) })
  }
}
