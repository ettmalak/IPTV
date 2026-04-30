# IPTV Player

Xtream Codes IPTV player for Windows. Built with Electron + Angular 18.

## Features
- Xtream Codes login (server URL, username, password)
- Live TV with categories, channels, and EPG (now & next)
- Movies (VOD) with grid browsing and search
- Series with seasons and episodes
- Encrypted credential storage (electron-store)
- Auto-login on startup
- Dark petrol/teal design

## Setup

```bash
cd iptv-player
npm install
```

## Run in development

```bash
npm run electron:dev
```

This runs `ng serve` and Electron in parallel. The Angular app loads at
`http://localhost:4200` and Electron points its window there.

## Build Windows installer

```bash
npm run electron:build
```

Output: `release/IPTV Player Setup x.x.x.exe`

## Architecture

```
electron/                    # Electron main + preload (Node context)
  main.ts                    # Window, IPC handlers, electron-store
  preload.ts                 # contextBridge exposing window.electron
src/app/
  core/
    models/xtream.models.ts  # All Xtream API types
    services/
      xtream.service.ts      # API calls + stream URL builders
      auth.service.ts        # Login flow + auto-login
      storage.service.ts     # IPC wrapper for electron-store
    guards/auth.guard.ts     # Route protection
  features/
    login/                   # Login form
    shell/                   # Sidebar layout for authenticated routes
    live-tv/                 # 3-column: categories | channels | player+EPG
    movies/                  # VOD grid + player
    series/                  # Series list -> seasons -> episodes -> player
    player/                  # hls.js wrapper
    settings/                # Account info + logout
```

## Xtream API used

- `player_api.php` (login, no action param)
- `get_live_categories` / `get_live_streams`
- `get_vod_categories` / `get_vod_streams` / `get_vod_info`
- `get_series_categories` / `get_series` / `get_series_info`
- `get_short_epg`
- Stream URLs: `/live/USER/PASS/ID.m3u8`, `/movie/USER/PASS/ID.EXT`, `/series/USER/PASS/ID.EXT`

## Stolperfallen / Known limitations

- **CORS:** `webSecurity: false` is set in Electron. This is OK in a desktop app but never in a browser.
- **MPEG-TS streams:** Some IPTV servers serve only `.ts` instead of HLS. If hls.js fails, install `mpegts.js` and add a fallback in `player.component.ts`.
- **Codec support:** Chromium ships with limited codecs. H.265/HEVC streams may not play. For broader support, swap the `<video>` player for an embedded VLC/MPV via `webchimera`.
- **EPG decoding:** Titles and descriptions are base64-encoded. Use `XtreamService.decodeEpgText()`.

## Roadmap (next iterations)

- [ ] Favorites tab (data layer is already there)
- [ ] Continue watching for VOD (saveWatchPosition is implemented)
- [ ] Full EPG grid view
- [ ] Multi-audio / subtitle picker
- [ ] M3U playlist support as fallback
- [ ] Picture-in-picture mode
