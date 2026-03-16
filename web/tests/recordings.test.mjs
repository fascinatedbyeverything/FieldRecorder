import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_COLOR, TYPE_COLORS } from "../public/js/config.js";
import { describeGeo, getRecordingColor, normalizeRecording, recordingStreamUrl } from "../public/js/recordings.js";

test("normalizeRecording fills defaults and can infer geography", () => {
  const recording = normalizeRecording({
    id: "1",
    title: "Rainforest dawn",
    provider: "",
    tags: ["birds", "amazon"],
    stream_url: "/stream/demo/1",
  });

  assert.equal(recording.provider, "unknown");
  assert.equal(recording.title, "Rainforest dawn");
  assert.equal(Array.isArray(recording.tags), true);
  assert.equal(recording.inferred_geo, true);
  assert.equal(typeof recording.lat, "number");
  assert.equal(typeof recording.lng, "number");
});

test("getRecordingColor prioritizes tags, species, and provider hints", () => {
  assert.equal(getRecordingColor({ id: "1", tags: ["urban"] }), TYPE_COLORS.urban);
  assert.equal(getRecordingColor({ id: "2", species: "song bird" }), TYPE_COLORS.birds);
  assert.equal(getRecordingColor({ id: "3", provider: "aporee" }), TYPE_COLORS.urban);
  assert.equal(getRecordingColor({ id: "4" }), DEFAULT_COLOR);
});

test("recordingStreamUrl keeps absolute URLs and prefixes relative ones", () => {
  assert.equal(
    recordingStreamUrl({ id: "1", stream_url: "https://example.com/audio.mp3" }),
    "https://example.com/audio.mp3",
  );
  assert.match(recordingStreamUrl({ id: "2", stream_url: "/stream/demo/2" }), /field-recordings-api|fieldrecorder-api/);
});

test("describeGeo distinguishes inferred and exact coordinates", () => {
  assert.equal(describeGeo({ id: "1" }), "No map point");
  assert.equal(describeGeo({ id: "2", lat: 1, lng: 2 }), "Exact coords");
  assert.equal(describeGeo({ id: "3", lat: 1, lng: 2, inferred_geo: true }), "Approx. mapped");
});
