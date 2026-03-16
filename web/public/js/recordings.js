// @ts-check

import { API_BASE, DEFAULT_COLOR, GEO_LOOKUP, TYPE_COLORS } from "./config.js";
import { stableJitter } from "./formatters.js";

/** @typedef {import("./types").Recording} Recording */

/**
 * @param {unknown} tags
 * @returns {string[]}
 */
export function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
}

/**
 * @param {Recording} rec
 * @returns {Recording}
 */
export function inferLocation(rec) {
  if (rec.lat != null && rec.lng != null) {
    return rec;
  }

  const text = [rec.title, ...(rec.tags || []), rec.species || ""].join(" ").toLowerCase();
  const keys = Object.keys(GEO_LOOKUP).sort((left, right) => right.length - left.length);

  for (const key of keys) {
    if (!text.includes(key)) {
      continue;
    }

    const lat = GEO_LOOKUP[key][0] + stableJitter(rec.id || rec.title || key, "lat") * 1.2;
    const lng = GEO_LOOKUP[key][1] + stableJitter(rec.id || rec.title || key, "lng") * 1.2;
    return { ...rec, lat, lng, inferred_geo: true };
  }

  return rec;
}

/**
 * @param {Recording} rec
 * @returns {Recording}
 */
export function normalizeRecording(rec) {
  return inferLocation({
    ...rec,
    title: rec.title || "Untitled",
    provider: rec.provider || "unknown",
    tags: normalizeTags(rec.tags),
    species: rec.species || null,
    license: rec.license || "",
    recorded_at: rec.recorded_at || null,
  });
}

/**
 * @param {Recording} rec
 */
export function getRecordingColor(rec) {
  const tags = normalizeTags(rec.tags).map((tag) => tag.toLowerCase());
  for (const type of Object.keys(TYPE_COLORS)) {
    if (tags.includes(type)) {
      return TYPE_COLORS[type];
    }
  }

  const species = String(rec.species || "").toLowerCase();
  if (species.includes("bird")) return TYPE_COLORS.birds;
  if (species.includes("mammal")) return TYPE_COLORS.mammals;
  if (species.includes("frog") || species.includes("toad")) return TYPE_COLORS.amphibians;
  if (species.includes("insect")) return TYPE_COLORS.insects;

  const provider = String(rec.provider || "").toLowerCase();
  if (provider === "xeno-canto" || provider === "xenocanto") return TYPE_COLORS.birds;
  if (provider === "aporee") return TYPE_COLORS.urban;
  if (provider === "wikimedia") return TYPE_COLORS.cultural;
  return DEFAULT_COLOR;
}

/**
 * @param {Recording} recording
 */
export function recordingStreamUrl(recording) {
  if (!recording?.stream_url) {
    return "";
  }

  return recording.stream_url.startsWith("http")
    ? recording.stream_url
    : `${API_BASE}${recording.stream_url}`;
}

/**
 * @param {Recording} rec
 */
export function describeGeo(rec) {
  if (rec.lat == null || rec.lng == null) {
    return "No map point";
  }
  return rec.inferred_geo ? "Approx. mapped" : "Exact coords";
}
