// @ts-check

/** @typedef {import("./types").SearchFilters} SearchFilters */

/**
 * Build the API query string from the current UI state.
 * `radius_km` is the canonical parameter; `radius` is preserved for compatibility.
 * @param {SearchFilters} filters
 */
export function buildSearchParams(filters) {
  const params = new URLSearchParams();
  const qParts = [];

  if (filters.searchText) {
    qParts.push(filters.searchText);
  }
  if (filters.activeTypes.length) {
    qParts.push(...filters.activeTypes);
  }
  if (filters.locationText && filters.searchLat == null && filters.searchLng == null) {
    qParts.push(filters.locationText);
  }

  if (qParts.length) {
    params.set("q", qParts.join(" "));
  }

  if (filters.activeTypes.length === 1) {
    params.set("type", filters.activeTypes[0]);
  }

  if (filters.searchLat != null && filters.searchLng != null) {
    params.set("lat", filters.searchLat.toFixed(5));
    params.set("lng", filters.searchLng.toFixed(5));
    params.set("radius_km", String(filters.searchRadius));
    params.set("radius", String(filters.searchRadius));
  }

  if (filters.minDuration > 0) {
    params.set("min_duration", String(filters.minDuration));
  }

  params.set("sort", "duration");
  params.set("per_page", filters.searchLat != null ? "120" : "60");
  return params;
}

/**
 * @param {URLSearchParams} params
 */
export function hasSearchIntent(params) {
  return params.has("q") || params.has("lat");
}
