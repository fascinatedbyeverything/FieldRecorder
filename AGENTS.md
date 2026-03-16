# AGENTS.md

## What Lives Here

- `app/` is the native SwiftUI client.
- `web/` is the static browser client.
- `ARCHITECTURE.md` is the fastest repo-wide orientation pass.
- `web/scripts/smoke-web.js` is the fastest end-to-end check for the web surface.

## Fastest Useful Commands

Run these from the repo root:

```bash
make check
make test
make smoke
make web-dry-run
```

## High-Signal Files

- `app/Sources/Models/SearchResult.swift`
  Native search query shape and query parameter serialization.
- `app/Sources/Services/APIClient.swift`
  Native API contract and upload/delete flows.
- `app/Sources/ViewModels/AppState.swift`
  Native search, selection, and playback orchestration.
- `web/public/app.js`
  Browser orchestration layer only.
- `web/public/js/search.js`
  Browser search serialization and query intent rules.
- `web/public/js/recordings.js`
  Browser recording normalization and inferred geo behavior.
- `web/public/js/api.js`
  Browser-side API and geocoder boundary.
- `web/public/index.html`
  DOM contract that `app.js` depends on.

## Working Rules

- Keep native and web search parameter names aligned with the deployed API.
- Treat `SearchQuery.queryItems` as the canonical native definition of search serialization.
- The web app is bundle-free. Do not introduce build steps unless there is a strong reason.
- When adding UI affordances in `web/public/index.html`, update the smoke script if the DOM contract changes.
- Keep web logic in `web/public/js/` pure when possible so it stays type-checkable and unit-testable.

## Required Checks After Non-Trivial Changes

```bash
make check
make test
make smoke
```
