# FieldRecorder

FieldRecorder is split into two clients that both consume the live [field-recordings-api](https://github.com/fascinatedbyeverything/field-recordings-api):

- `app/` is the native SwiftUI app for iOS and macOS.
- `web/` is a static MapLibre client deployed with Wrangler assets.

## Repo Layout

```text
.
├── AGENTS.md              Agent-oriented repo guide
├── ARCHITECTURE.md        Module and runtime map
├── Makefile               Common build, test, and smoke targets
├── app/
│   ├── FieldRecorder.xcodeproj
│   ├── Package.swift
│   ├── Sources/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── ViewModels/
│   │   └── Views/
│   └── Tests/
└── web/
    ├── package.json
    ├── scripts/
    │   └── smoke-web.js
    ├── public/
    │   ├── app.js
    │   └── js/
    │       ├── api.js
    │       ├── config.js
    │       ├── dom.js
    │       ├── formatters.js
    │       ├── map-helpers.js
    │       ├── ratings.js
    │       ├── recordings.js
    │       └── search.js
    │   ├── index.html
    │   └── style.css
    ├── tests/
    └── wrangler.jsonc
```

## Architecture Notes

- The backend already exists. This repo does not contain server logic.
- The standalone web app talks to `https://field-recordings-api.ashtarchris.workers.dev`.
- When mounted under `fbe.stereovoid.com/fieldrecorder`, the parent `fbe` Worker proxies API requests through `/fieldrecorder-api` to avoid browser CORS issues.
- `SearchQuery.queryItems` in the native app is the canonical native-side definition of search serialization. Keep it aligned with `web/public/js/search.js`.

## Common Commands

From the repo root:

```bash
make check       # swift build + web syntax/type checks
make test        # Swift and web tests
make smoke       # static asset checks + live API smoke
make web-dry-run # wrangler deploy --dry-run
```

## Native App

- Open `app/FieldRecorder.xcodeproj` in Xcode 15+ for UI work.
- Package commands run from `app/`:

```bash
swift build
swift test
swift run FieldRecorder
```

## Web App

Install Wrangler once inside `web/`:

```bash
cd web
npm install
npm run dev
npm run check
npm run typecheck
npm test
npm run smoke
npm run dry-run
```

The web client is intentionally static:

- `public/index.html` contains the map shell, side panel, player, and upload modal.
- `public/style.css` owns layout, theming, and responsive behavior.
- `public/app.js` is now the orchestration layer only.
- `public/js/` contains the typed, testable browser modules.
- `tests/` covers pure browser logic with the Node test runner.
- `scripts/smoke-web.js` validates both the static contract and the live API contract.

## Verification Baseline

Before shipping changes that touch search, playback, or upload behavior, run:

```bash
make check
make test
make smoke
```
