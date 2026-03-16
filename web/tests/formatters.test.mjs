import test from "node:test";
import assert from "node:assert/strict";

import { bytesToHuman, formatDuration, stableJitter, toTitleCase } from "../public/js/formatters.js";

test("formatDuration formats minutes and hours", () => {
  assert.equal(formatDuration(125), "2:05");
  assert.equal(formatDuration(3723), "1:02:03");
  assert.equal(formatDuration(null), "0:00");
});

test("bytesToHuman produces readable file sizes", () => {
  assert.equal(bytesToHuman(999), "999 B");
  assert.equal(bytesToHuman(2048), "2.0 KB");
  assert.equal(bytesToHuman(1024 * 1024 * 12), "12 MB");
});

test("toTitleCase normalizes mixed separators", () => {
  assert.equal(toTitleCase("deep_ocean"), "Deep Ocean");
  assert.equal(toTitleCase("city-street urban"), "City Street Urban");
});

test("stableJitter is deterministic per seed and axis", () => {
  assert.equal(stableJitter("abc", "lat"), stableJitter("abc", "lat"));
  assert.notEqual(stableJitter("abc", "lat"), stableJitter("abc", "lng"));
});
