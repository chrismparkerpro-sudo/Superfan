const { parseCookies } = require('../../lib/cookies')
const { fetchFollowedArtists } = require('../../lib/spotify')

module.exports = async function handler(req,res){
  try{
    const token = parseCookies(req).sf_access
    if(!token) return res.status(401).json({ error:'not_authed' })
    const items = await fetchFollowedArtists(token, 50, 200)
    res.status(200).json({ items })
  }catch(e){
    console.error(e)
    res.status(500).json({ error:'spotify_error' })
  }
}
