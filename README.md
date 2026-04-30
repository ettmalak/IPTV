# IPTV Player

A modern, fast IPTV player for Windows desktop. Connects to any Xtream Codes compatible server and lets you browse Live TV, Movies, and Series in a clean, dark-themed interface.

Built with Electron and Angular 18 — designed to handle large catalogs (5,000+ channels, 20,000+ movies) without breaking a sweat.

![Status](https://img.shields.io/badge/status-active-4dd0c8) ![Platform](https://img.shields.io/badge/platform-Windows-08161c) ![License](https://img.shields.io/badge/license-MIT-a8c0c8)

---

## Features

- **Xtream Codes login** — server URL, username, password is all you need
- **Live TV** with category filtering, channel search, and Now & Next EPG
- **Movies (VOD)** with poster grid, search, and instant playback
- **Series** with season and episode browsing
- **Virtualized lists** — smooth scrolling through thousands of items
- **Lazy-loaded posters** — only the images you can see get fetched
- **Encrypted credential storage** — passwords never sit in plain text on disk
- **Auto-login** on startup
- **HLS streaming** with hls.js, including live error recovery
- **Dark petrol/teal design** that doesn't burn your eyes at night

---



## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Electron 32 |
| UI framework | Angular 18 (standalone components, signals) |
| Language | TypeScript 5.5 |
| Streaming | hls.js with Web Worker parsing |
| Virtual scrolling | Angular CDK |
| Storage | electron-store (encrypted) |
| Styling | SCSS, custom design system |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- An active Xtream Codes account (server URL, username, password)

### Install

```bash
git clone https://github.com/ettmalak/IPTV.git
cd iptv-player
npm install
```

### Run in development

```bash
npm run electron:dev
```

This runs `ng serve` and Electron in parallel. The Angular app loads at `http://localhost:4200` and Electron loads it into a desktop window with hot reload enabled.

### Build the Windows installer

```bash
npm run electron:build
```

The installer ends up in `release/IPTV Player Setup x.x.x.exe`.

---

## Project Structure

```
iptv-player/
├── electron/                       # Electron main + preload (Node context)
│   ├── main.ts                     # Window, IPC handlers, encrypted store
│   └── preload.ts                  # contextBridge exposing window.electron
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/             # Xtream API response types
│   │   │   ├── services/
│   │   │   │   ├── xtream.service.ts    # API calls + caching + URL builders
│   │   │   │   ├── auth.service.ts      # Login flow + auto-login
│   │   │   │   └── storage.service.ts   # IPC wrapper for electron-store
│   │   │   └── guards/             # Auth route guard
│   │   └── features/
│   │       ├── login/              # Login form
│   │       ├── shell/              # Sidebar layout for authenticated views
│   │       ├── live-tv/            # Categories | Channels | Player + EPG
│   │       ├── movies/             # Virtualized grid + search + player
│   │       ├── series/             # Series → Seasons → Episodes → Player
│   │       ├── player/             # hls.js player wrapper
│   │       └── settings/           # Account info + logout
│   └── styles.scss                 # Global styles + scrollbar theme
└── package.json
```

---

## Xtream Codes API Used

Authentication and metadata go through `player_api.php`. Streams are served from dedicated paths.

| Endpoint | Purpose |
|----------|---------|
| `player_api.php` (no action) | Login + account info |
| `get_live_categories` / `get_live_streams` | Live TV browsing |
| `get_vod_categories` / `get_vod_streams` / `get_vod_info` | Movies |
| `get_series_categories` / `get_series` / `get_series_info` | Series |
| `get_short_epg` | Now & Next EPG per channel |
| `/live/USER/PASS/ID.m3u8` | Live stream playback |
| `/movie/USER/PASS/ID.EXT` | VOD playback |
| `/series/USER/PASS/ID.EXT` | Episode playback |

All Xtream API responses are typed in `src/app/core/models/xtream.models.ts`.

---

## Performance Notes

This app is built to handle realistic IPTV catalogs without slowdowns:

- **Virtual scrolling** in every list and grid — the DOM only contains what's visible on screen, regardless of catalog size.
- **API response caching** — switching between categories you've already visited is instant.
- **Lazy image loading** — posters load only when scrolled into view.
- **Web Worker HLS parsing** (`enableWorker: true`) — keeps the UI responsive while video is playing.
- **OnPush change detection** throughout — Angular only re-renders what actually changed.

---

## Known Limitations

- **CORS is bypassed** in the Electron renderer. This is acceptable for a desktop app where the renderer is fully controlled, but the same approach should never be used in a public web build.
- **Codec support** — Chromium ships with limited codecs. H.265/HEVC streams may decode slowly or not at all. For full codec coverage, the `<video>` element would need to be swapped for an embedded VLC or mpv backend.
- **MPEG-TS streams** — some servers serve raw `.ts` instead of HLS. Adding `mpegts.js` as a fallback handles this case.

---

## Roadmap

- [ ] Favorites tab (storage layer is already in place)
- [ ] Continue Watching for VOD (position saving is already implemented)
- [ ] Full EPG grid view with timeline
- [ ] Multi-audio and subtitle picker
- [ ] M3U playlist support as fallback for non-Xtream providers
- [ ] Picture-in-picture mode
- [ ] mpv backend for full codec support

---

## Contributing

This is currently a personal project, but issues and PRs are welcome. If you find a bug or want a feature, open an issue first so we can discuss the approach.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Acknowledgements

- [hls.js](https://github.com/video-dev/hls.js) for HLS playback
- [electron-store](https://github.com/sindresorhus/electron-store) for encrypted storage
- [Angular CDK](https://material.angular.io/cdk) for virtual scrolling
- The Xtream Codes community for keeping the API documented
