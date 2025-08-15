const cookie = require('cookie')

function setHttpOnlyCookie(res, name, value, opts = {}) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  const serialized = cookie.serialize(name, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2, // 2h
    ...opts
  })
  res.setHeader('Set-Cookie', serialized)
}

function parseCookies(req) {
  const header = req.headers.cookie || ''
  return cookie.parse(header)
}

module.exports = { setHttpOnlyCookie, parseCookies }
