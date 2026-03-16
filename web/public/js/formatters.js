// @ts-check

/**
 * @param {unknown} value
 */
export function esc(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

/**
 * @param {unknown} value
 */
export function toTitleCase(value) {
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * @param {number | null | undefined} seconds
 */
export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) {
    return "0:00";
  }

  const total = Math.max(0, Math.round(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * @param {string | null | undefined} value
 */
export function formatRecordedDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return String(value).split("T")[0];
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * @param {number} lat
 * @param {number} lng
 */
export function formatCoordinates(lat, lng) {
  return `${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)}`;
}

/**
 * @param {string} value
 */
export function escapeSelector(value) {
  if (typeof window !== "undefined" && window.CSS?.escape) {
    return window.CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, "\\$&");
}

/**
 * @param {number | null | undefined} bytes
 */
export function bytesToHuman(bytes) {
  if (!bytes) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/**
 * @param {string} seed
 * @param {string} axis
 */
export function stableJitter(seed, axis) {
  let hash = 2166136261;
  const input = `${seed}:${axis}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return ((hash >>> 0) % 1000) / 1000 - 0.5;
}
