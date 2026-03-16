import test from "node:test";
import assert from "node:assert/strict";

import { buildSearchParams, hasSearchIntent } from "../public/js/search.js";

test("buildSearchParams serializes keyword, location, and duration filters", () => {
  const params = buildSearchParams({
    searchText: "loon",
    locationText: "Halifax",
    activeTypes: ["birds"],
    searchLat: 44.6488,
    searchLng: -63.5752,
    searchRadius: 250,
    minDuration: 300,
  });

  assert.equal(params.get("q"), "loon birds");
  assert.equal(params.get("type"), "birds");
  assert.equal(params.get("lat"), "44.64880");
  assert.equal(params.get("lng"), "-63.57520");
  assert.equal(params.get("radius_km"), "250");
  assert.equal(params.get("radius"), "250");
  assert.equal(params.get("min_duration"), "300");
  assert.equal(params.get("sort"), "duration");
});

test("buildSearchParams folds unresolved place text into the query", () => {
  const params = buildSearchParams({
    searchText: "",
    locationText: "Nova Scotia",
    activeTypes: [],
    searchLat: null,
    searchLng: null,
    searchRadius: 100,
    minDuration: 60,
  });

  assert.equal(params.get("q"), "Nova Scotia");
  assert.equal(hasSearchIntent(params), true);
});

test("hasSearchIntent rejects empty searches", () => {
  const params = buildSearchParams({
    searchText: "",
    locationText: "",
    activeTypes: [],
    searchLat: null,
    searchLng: null,
    searchRadius: 100,
    minDuration: 60,
  });

  assert.equal(hasSearchIntent(params), false);
});
