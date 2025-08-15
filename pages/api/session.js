const { parseCookies } = require('../../lib/cookies')
module.exports = function handler(req,res){
  const cookies = parseCookies(req)
  res.status(200).json({ spotifyConnected: Boolean(cookies.sf_access) })
}
