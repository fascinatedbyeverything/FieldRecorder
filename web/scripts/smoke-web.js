// @ts-check

import { readFile } from "node:fs/promises";

const apiBase = process.env.FIELDRECORDER_API_BASE ?? "https://field-recordings-api.ashtarchris.workers.dev";
const requiredIds = [
  "map",
  "panel",
  "search-input",
  "results-list",
  "player",
  "upload-modal",
  "upload-form",
  "upload-map",
];

/**
 * @param {string} path
 */
async function readUtf8(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

/**
 * @param {unknown} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @param {string} path
 */
function endpoint(path) {
  return new URL(path, apiBase.endsWith("/") ? apiBase : `${apiBase}/`);
}

/**
 * @param {string | URL} url
 */
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  const [html, css, js] = await Promise.all([
    readUtf8("../public/index.html"),
    readUtf8("../public/style.css"),
    readUtf8("../public/app.js"),
  ]);

  assert(html.includes('href="style.css"'), "index.html no longer links style.css");
  assert(html.includes('type="module" src="app.js"'), "index.html no longer links the module app.js entrypoint");
  assert(css.includes(":root"), "style.css is missing the root custom property block");
  assert(js.includes('from "./js/'), "app.js is no longer importing the modular browser helpers");

  for (const id of requiredIds) {
    assert(html.includes(`id="${id}"`), `index.html is missing required id="${id}"`);
  }

  const providers = await fetchJson(endpoint("providers"));
  assert(Array.isArray(providers), "providers payload is not an array");
  assert(providers.length > 0, "providers payload is empty");
  assert(
    providers.every((/** @type {{ name?: unknown }} */ provider) => typeof provider.name === "string"),
    "providers payload is missing provider names",
  );

  const searchUrl = endpoint("search");
  searchUrl.searchParams.set("q", "birds");
  searchUrl.searchParams.set("per_page", "1");

  const result = await fetchJson(searchUrl);
  assert(Array.isArray(result.recordings), "search payload is missing a recordings array");
  assert(typeof result.total === "number", "search payload is missing a numeric total");

  console.log(`Web smoke passed: ${providers.length} providers, ${result.total} search results for "birds".`);
}

main().catch((error) => {
  console.error(`Web smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
