// @ts-check

import { API_BASE } from "./config.js";

/** @typedef {import("./types").GeocodeResult} GeocodeResult */
/** @typedef {import("./types").ProviderMeta[]} ProviderList */
/** @typedef {import("./types").SearchResponse} SearchResponse */
/** @typedef {import("./types").CategoryResponse} CategoryResponse */
/** @typedef {import("./types").UploadResponse} UploadResponse */

/**
 * @template T
 * @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 * @returns {Promise<T>}
 */
async function fetchJson(input, init) {
  const response = await fetch(input, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with ${response.status}`);
  }
  return data;
}

/**
 * @param {string} query
 * @returns {Promise<GeocodeResult | null>}
 */
export async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": navigator.language || "en",
    },
  });

  if (!response.ok) {
    throw new Error(`geocoder returned ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || !data.length) {
    return null;
  }

  const place = data[0];
  return {
    lat: Number(place.lat),
    lng: Number(place.lon),
    name: String(place.display_name || query)
      .split(",")
      .slice(0, 3)
      .join(", "),
  };
}

/**
 * @param {URLSearchParams} params
 * @param {AbortSignal} [signal]
 * @returns {Promise<SearchResponse>}
 */
export function searchRecordings(params, signal) {
  return fetchJson(`${API_BASE}/search?${params.toString()}`, { signal });
}

/**
 * @returns {Promise<ProviderList>}
 */
export function fetchProviders() {
  return fetchJson(`${API_BASE}/providers`);
}

/**
 * @returns {Promise<CategoryResponse>}
 */
export function fetchCategories() {
  return fetchJson(`${API_BASE}/categories`);
}

/**
 * @param {FormData} formData
 * @returns {Promise<UploadResponse>}
 */
export function uploadRecording(formData) {
  return fetchJson(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
}
