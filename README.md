# Superfan — Fresh Start (GitHub-ready)

Clean Next.js prototype: **Spotify connect** + **Followed artists preview** + **Location selector** (no events).

## Deploy
1) Create a new GitHub repo and upload this folder (drag-and-drop).
2) In Vercel → Add New Project → Import the repo.
3) Set **Environment Variables (Production)**:
```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://YOUR-APP.vercel.app/api/callback
APP_BASE_URL=https://YOUR-APP.vercel.app
```
4) In Spotify Developer Dashboard → Your App → Settings → Redirect URIs, add the same:
```
https://YOUR-APP.vercel.app/api/callback
```
5) Deploy → Open your live URL → **Connect Spotify** → **Load Followed Artists**.

## Routes
- `/` — UI with location dropdown, connect button, artist list
- `/api/login` — builds authorize URL; returns JSON error if env missing
- `/api/callback` — exchanges code; sets cookie; redirects
- `/api/followed` — returns followed artists (requires cookie)
- `/api/session` — `{ spotifyConnected: boolean }`
- `/api/envcheck` — verifies env var presence
- `/api/health` — simple healthcheck
