# Architecture

## Native

- `app/Sources/Models/` holds the API-facing models.
- `app/Sources/Services/APIClient.swift` is the native API boundary.
- `app/Sources/ViewModels/AppState.swift` coordinates search, selection, and playback.
- `app/Tests/FieldRecorderTests/` covers the current native contract surface.

## Web

The browser client stays bundle-free but is no longer a single-file monolith:

- `web/public/app.js`
  Orchestrates UI state, map lifecycle, playback, search, and upload.
- `web/public/js/config.js`
  Environment-specific API base and shared constants.
- `web/public/js/api.js`
  Fetch wrappers for search, metadata, upload, and geocoding.
- `web/public/js/search.js`
  Search query serialization. Keep this aligned with the Swift `SearchQuery`.
- `web/public/js/recordings.js`
  Recording normalization, inferred geography, color selection, and stream URL resolution.
- `web/public/js/formatters.js`
  Pure formatting helpers.
- `web/public/js/map-helpers.js`
  MapLibre style and geojson helpers.
- `web/public/js/dom.js`
  Required DOM bindings with fail-fast selectors.
- `web/public/js/ratings.js`
  Local storage access for star ratings.
- `web/tests/`
  Node-based tests for the pure browser modules.
- `web/scripts/smoke-web.js`
  Static asset and live API smoke coverage.

## Command Surface

From the repo root:

```bash
make check
make test
make smoke
make web-dry-run
```

From `web/`:

```bash
npm run check
npm run typecheck
npm test
npm run smoke
npm run dry-run
```
