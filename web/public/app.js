// @ts-check

import { fetchCategories, fetchProviders, geocode, searchRecordings, uploadRecording } from "./js/api.js";
import { DEFAULT_COLOR, DEFAULT_LOCATION_HINT, DEFAULT_TYPES, TYPE_COLORS } from "./js/config.js";
import { elements } from "./js/dom.js";
import {
  bytesToHuman,
  esc,
  escapeSelector,
  formatCoordinates,
  formatDuration,
  formatRecordedDate,
  toTitleCase,
} from "./js/formatters.js";
import { buildMapStyle, createRadiusGeoJSON, emptyFeatureCollection } from "./js/map-helpers.js";
import { getRating, ratingMarkup, setRating } from "./js/ratings.js";
import { describeGeo, getRecordingColor, normalizeRecording, normalizeTags, recordingStreamUrl } from "./js/recordings.js";
import { buildSearchParams, hasSearchIntent } from "./js/search.js";

/** @typedef {import("./js/types").ProviderMeta} ProviderMeta */
/** @typedef {import("./js/types").Recording} Recording */

/**
 * @typedef AppState
 * @property {any | null} map
 * @property {boolean} mapReady
 * @property {any | null} uploadMap
 * @property {any | null} uploadMarker
 * @property {any | null} locationMarker
 * @property {any | null} popup
 * @property {Recording[]} recordings
 * @property {Map<string, Recording>} recordingsById
 * @property {Recording | null} selectedRecording
 * @property {number | null} searchLat
 * @property {number | null} searchLng
 * @property {number} searchRadius
 * @property {number} minDuration
 * @property {boolean} panelOpen
 * @property {boolean} searchBusy
 * @property {string[]} categories
 * @property {ProviderMeta[]} providers
 * @property {HTMLButtonElement | null} activeScene
 * @property {AbortController | null} searchAbortController
 */

/** @type {AppState} */
const state = {
  map: null,
  mapReady: false,
  uploadMap: null,
  uploadMarker: null,
  locationMarker: null,
  popup: null,
  recordings: [],
  recordingsById: new Map(),
  selectedRecording: null,
  searchLat: null,
  searchLng: null,
  searchRadius: 100,
  minDuration: 60,
  panelOpen: window.innerWidth > 820,
  searchBusy: false,
  categories: [...DEFAULT_TYPES],
  providers: [],
  activeScene: null,
  searchAbortController: null,
};

/**
 * @param {unknown} error
 */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// Panel and filter UI

/**
 * @param {boolean} open
 */
function setPanelOpen(open) {
  state.panelOpen = open;
  elements.panel.classList.toggle("panel-open", open);
  elements.panel.classList.toggle("panel-closed", !open);
  elements.panelToggle.classList.toggle("is-shifted", !open);
  elements.panelToggle.setAttribute("aria-expanded", String(open));

  requestAnimationFrame(() => {
    if (state.map) {
      state.map.resize();
    }
  });
}

function updateRadiusUI() {
  elements.radiusValue.textContent = String(state.searchRadius);
  elements.radiusReadout.textContent = String(state.searchRadius);
  elements.radiusSlider.value = String(state.searchRadius);
}

function readActiveTypes() {
  return Array.from(elements.typeChips.querySelectorAll(".chip"))
    .filter((chip) => chip instanceof HTMLElement && chip.classList.contains("active"))
    .map((chip) => /** @type {HTMLElement} */ (chip).dataset.type || "")
    .filter(Boolean);
}

function describeLocationFilter() {
  if (state.searchLat == null || state.searchLng == null) {
    return "";
  }

  const placeLabel = elements.locationInput.value.trim();
  return placeLabel ? `${placeLabel} / ${state.searchRadius} km` : `Pinned location / ${state.searchRadius} km`;
}

function renderActiveFilters() {
  const pills = [];
  const searchValue = elements.searchInput.value.trim();
  const activeTypes = readActiveTypes();

  if (searchValue) {
    pills.push(`<span class="active-filter-pill">Query: ${esc(searchValue)}</span>`);
  }

  if (state.searchLat != null && state.searchLng != null) {
    pills.push(`<span class="active-filter-pill">Geo: ${esc(describeLocationFilter())}</span>`);
  } else if (elements.locationInput.value.trim()) {
    pills.push(`<span class="active-filter-pill">Place text: ${esc(elements.locationInput.value.trim())}</span>`);
  }

  if (activeTypes.length) {
    pills.push(`<span class="active-filter-pill">Type: ${esc(activeTypes.map(toTitleCase).join(", "))}</span>`);
  }

  if (state.minDuration > 0) {
    pills.push(`<span class="active-filter-pill">Minimum: ${esc(formatDuration(state.minDuration))}</span>`);
  }

  elements.activeFilters.innerHTML = pills.join("");
}

function renderTypeChips() {
  const activeTypes = new Set(readActiveTypes());
  elements.typeChips.innerHTML = state.categories
    .map((type) => {
      const color = TYPE_COLORS[type] || DEFAULT_COLOR;
      const active = activeTypes.has(type);
      return `
        <button
          type="button"
          class="chip type-chip${active ? " active" : ""}"
          data-type="${esc(type)}"
          style="--chip-color:${esc(color)}"
        >
          ${esc(toTitleCase(type))}
        </button>
      `;
    })
    .join("");
}

/**
 * @param {string[]} types
 */
function setActiveTypes(types) {
  const wanted = new Set(types);
  elements.typeChips.querySelectorAll(".chip").forEach((chip) => {
    if (!(chip instanceof HTMLElement)) {
      return;
    }
    chip.classList.toggle("active", wanted.has(chip.dataset.type || ""));
  });
}

/**
 * @param {number} value
 */
function setDuration(value) {
  state.minDuration = Number(value);
  elements.durationChips.querySelectorAll(".chip").forEach((chip) => {
    if (!(chip instanceof HTMLElement)) {
      return;
    }
    chip.classList.toggle("active", Number(chip.dataset.duration) === state.minDuration);
  });
  renderActiveFilters();
}

function clearSceneSelection() {
  if (!state.activeScene) {
    return;
  }
  state.activeScene.classList.remove("is-active");
  state.activeScene = null;
}

/**
 * @param {HTMLButtonElement} button
 */
function toggleScene(button) {
  clearSceneSelection();
  state.activeScene = button;
  button.classList.add("is-active");
}

/**
 * @param {boolean} busy
 */
function setSearchBusy(busy) {
  state.searchBusy = busy;
  elements.searchBtn.disabled = busy;
  elements.searchBtn.textContent = busy ? "Searching..." : "Search";
  elements.resultsLoading.classList.toggle("hidden", !busy);
}

/**
 * @param {string} title
 * @param {string} detail
 */
function setEmptyState(title, detail) {
  elements.resultsEmpty.innerHTML = `<strong>${esc(title)}</strong><span>${esc(detail)}</span>`;
  elements.resultsEmpty.classList.remove("hidden");
}

function clearResults() {
  state.recordings = [];
  state.recordingsById.clear();
  elements.resultsHeader.innerHTML = "";
  elements.resultsList.innerHTML = "";
  elements.resultCountStat.textContent = "Idle";
  updateRecordingSource([]);
  updateSelectedRecordingMarker();
}

// Map state

/**
 * @param {{ resetInput?: boolean }} [options]
 */
function clearLocation({ resetInput = true } = {}) {
  state.searchLat = null;
  state.searchLng = null;
  if (resetInput) {
    elements.locationInput.value = "";
  }
  elements.locationHint.textContent = DEFAULT_LOCATION_HINT;
  if (state.locationMarker) {
    state.locationMarker.remove();
    state.locationMarker = null;
  }
  updateRadiusCircle();
  renderActiveFilters();
}

function updateLocationMarker() {
  if (!state.mapReady) {
    return;
  }

  if (state.searchLat == null || state.searchLng == null) {
    if (state.locationMarker) {
      state.locationMarker.remove();
      state.locationMarker = null;
    }
    return;
  }

  if (!state.locationMarker) {
    const marker = document.createElement("div");
    marker.style.width = "18px";
    marker.style.height = "18px";
    marker.style.borderRadius = "999px";
    marker.style.background = "#80e7bf";
    marker.style.border = "3px solid rgba(4,16,22,0.9)";
    marker.style.boxShadow = "0 0 0 4px rgba(128,231,191,0.22)";
    state.locationMarker = new maplibregl.Marker({ element: marker });
  }

  state.locationMarker.setLngLat([state.searchLng, state.searchLat]).addTo(state.map);
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {string} label
 * @param {{ animate?: boolean }} [options]
 */
function setSearchLocation(lat, lng, label, { animate = true } = {}) {
  state.searchLat = Number(lat);
  state.searchLng = Number(lng);

  if (label) {
    elements.locationInput.value = label;
    elements.locationHint.textContent = label;
  } else {
    elements.locationHint.textContent = `Pinned: ${formatCoordinates(state.searchLat, state.searchLng)}`;
  }

  updateLocationMarker();
  updateRadiusCircle();
  renderActiveFilters();

  if (animate && state.mapReady) {
    state.map.flyTo({
      center: [state.searchLng, state.searchLat],
      zoom: Math.max(state.map.getZoom(), 6),
      essential: true,
    });
  }
}

function updateRadiusCircle() {
  if (!state.mapReady) {
    return;
  }

  const source = state.map.getSource("search-area");
  if (!source) {
    return;
  }

  if (state.searchLat == null || state.searchLng == null) {
    source.setData(emptyFeatureCollection());
    return;
  }

  source.setData(createRadiusGeoJSON(state.searchLat, state.searchLng, state.searchRadius));
}

/**
 * @param {Recording[]} recordings
 */
function updateRecordingSource(recordings) {
  if (!state.mapReady) {
    return;
  }

  const source = state.map.getSource("recordings");
  if (!source) {
    return;
  }

  const features = recordings
    .filter((recording) => recording.lat != null && recording.lng != null)
    .map((recording) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [recording.lng, recording.lat],
      },
      properties: {
        recordingId: recording.id,
        title: recording.title || "Untitled",
        color: getRecordingColor(recording),
      },
    }));

  source.setData({ type: "FeatureCollection", features });
}

function updateSelectedRecordingMarker() {
  if (!state.mapReady) {
    return;
  }

  const source = state.map.getSource("selected-recording");
  if (!source) {
    return;
  }

  const recording = state.selectedRecording;
  if (!recording || recording.lat == null || recording.lng == null) {
    source.setData(emptyFeatureCollection());
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [recording.lng, recording.lat] },
      },
    ],
  });
}

/**
 * @param {Recording[]} recordings
 */
function fitMapToRecordings(recordings) {
  if (!state.mapReady) {
    return;
  }

  const geoRecordings = recordings.filter((recording) => recording.lat != null && recording.lng != null);
  if (!geoRecordings.length) {
    if (state.searchLat != null && state.searchLng != null) {
      state.map.flyTo({
        center: [state.searchLng, state.searchLat],
        zoom: Math.max(state.map.getZoom(), 6),
      });
    }
    return;
  }

  if (geoRecordings.length === 1) {
    state.map.flyTo({
      center: [geoRecordings[0].lng, geoRecordings[0].lat],
      zoom: 8,
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  geoRecordings.forEach((recording) => bounds.extend([recording.lng, recording.lat]));
  const narrowLayout = window.innerWidth <= 820;

  state.map.fitBounds(bounds, {
    padding: narrowLayout
      ? { top: 70, right: 30, bottom: 180, left: 30 }
      : { top: 80, right: 80, bottom: 120, left: state.panelOpen ? 480 : 80 },
    maxZoom: 8,
    duration: 1200,
  });
}

function initMap() {
  state.map = new maplibregl.Map({
    container: "map",
    style: buildMapStyle(),
    center: [-20, 20],
    zoom: 2.1,
    maxZoom: 18,
    attributionControl: true,
  });

  state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

  state.map.on("load", () => {
    state.mapReady = true;

    state.map.addSource("recordings", {
      type: "geojson",
      data: emptyFeatureCollection(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    state.map.addSource("selected-recording", {
      type: "geojson",
      data: emptyFeatureCollection(),
    });

    state.map.addSource("search-area", {
      type: "geojson",
      data: emptyFeatureCollection(),
    });

    state.map.addLayer({
      id: "search-area-fill",
      type: "fill",
      source: "search-area",
      paint: {
        "fill-color": "#80e7bf",
        "fill-opacity": 0.1,
      },
    });

    state.map.addLayer({
      id: "search-area-line",
      type: "line",
      source: "search-area",
      paint: {
        "line-color": "#80e7bf",
        "line-width": 2,
        "line-opacity": 0.7,
      },
    });

    state.map.addLayer({
      id: "cluster-circles",
      type: "circle",
      source: "recordings",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#74d8ff",
          10,
          "#55cfda",
          30,
          "#4acb78",
          100,
          "#f2b167",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          10,
          24,
          30,
          30,
          100,
          36,
        ],
        "circle-stroke-color": "#031015",
        "circle-stroke-width": 2,
      },
    });

    state.map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "recordings",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans Bold"],
        "text-size": 13,
      },
      paint: {
        "text-color": "#031015",
      },
    });

    state.map.addLayer({
      id: "recording-points",
      type: "circle",
      source: "recordings",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": 7.5,
        "circle-stroke-color": "#031015",
        "circle-stroke-width": 2,
      },
    });

    state.map.addLayer({
      id: "selected-recording-point",
      type: "circle",
      source: "selected-recording",
      paint: {
        "circle-color": "#f2b167",
        "circle-radius": 14,
        "circle-stroke-color": "#031015",
        "circle-stroke-width": 3,
        "circle-opacity": 0.8,
      },
    });

    state.map.addLayer({
      id: "selected-recording-core",
      type: "circle",
      source: "selected-recording",
      paint: {
        "circle-color": "#fff7d6",
        "circle-radius": 5.5,
      },
    });

    state.map.on("click", "cluster-circles", /** @param {any} event */ (event) => {
      const feature = state.map.queryRenderedFeatures(event.point, { layers: ["cluster-circles"] })[0];
      if (!feature) {
        return;
      }

      const clusterId = feature.properties.cluster_id;
      state.map.getSource("recordings").getClusterExpansionZoom(clusterId, (/** @type {any} */ err, /** @type {number} */ zoom) => {
        if (!err) {
          state.map.easeTo({
            center: feature.geometry.coordinates,
            zoom,
          });
        }
      });
    });

    state.map.on("click", "recording-points", /** @param {any} event */ (event) => {
      const feature = event.features?.[0];
      if (!feature) {
        return;
      }

      const recording = state.recordingsById.get(feature.properties.recordingId);
      if (!recording) {
        return;
      }

      state.selectedRecording = recording;
      syncResultSelection();
      updateSelectedRecordingMarker();
      scrollResultIntoView(recording.id);
      showPopup(recording, feature.geometry.coordinates.slice());
    });

    ["cluster-circles", "recording-points"].forEach((layerId) => {
      state.map.on("mouseenter", layerId, () => {
        state.map.getCanvas().style.cursor = "pointer";
      });
      state.map.on("mouseleave", layerId, () => {
        state.map.getCanvas().style.cursor = "";
      });
    });

    state.map.on("click", /** @param {any} event */ (event) => {
      const features = state.map.queryRenderedFeatures(event.point, {
        layers: ["cluster-circles", "recording-points"],
      });
      if (features.length) {
        return;
      }

      setSearchLocation(event.lngLat.lat, event.lngLat.lng, "", { animate: false });
      elements.locationInput.value = "";
      elements.locationHint.textContent = `Pinned: ${formatCoordinates(event.lngLat.lat, event.lngLat.lng)}`;
    });

    updateRadiusCircle();
    updateRecordingSource(state.recordings);
    updateSelectedRecordingMarker();
    updateLocationMarker();
  });
}

// Search, playback, and results

function syncResultSelection() {
  elements.resultsList.querySelectorAll(".result-card").forEach((card) => {
    if (!(card instanceof HTMLElement)) {
      return;
    }
    card.classList.toggle("is-active", card.dataset.id === state.selectedRecording?.id);
  });
}

/**
 * @param {string} id
 */
function scrollResultIntoView(id) {
  const card = elements.resultsList.querySelector(`.result-card[data-id="${escapeSelector(id)}"]`);
  if (card instanceof HTMLElement) {
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

/**
 * @param {boolean} playing
 */
function showPlayingState(playing) {
  elements.playIcon.classList.toggle("hidden", playing);
  elements.pauseIcon.classList.toggle("hidden", !playing);
}

/**
 * @param {Recording} recording
 */
function playRecording(recording) {
  const streamUrl = recordingStreamUrl(recording);
  if (!streamUrl) {
    elements.resultsError.textContent = "This recording does not have a playable stream URL.";
    elements.resultsError.classList.remove("hidden");
    return;
  }

  elements.resultsError.classList.add("hidden");
  state.selectedRecording = recording;
  updateSelectedRecordingMarker();
  syncResultSelection();
  scrollResultIntoView(recording.id);

  elements.player.classList.remove("hidden");
  elements.playerTitle.textContent = recording.title || "Untitled";
  elements.playerProvider.textContent = `${recording.provider || "Unknown"}${recording.inferred_geo ? " / approx. mapped" : ""}`;

  if (elements.audio.src !== streamUrl) {
    elements.audio.src = streamUrl;
  }

  elements.audio.play().catch(() => {
    elements.resultsError.textContent = "Playback was blocked by the browser. Tap play again to start audio.";
    elements.resultsError.classList.remove("hidden");
  });

  showTrackOverlay(recording);

  if (recording.lat != null && recording.lng != null && state.mapReady) {
    state.map.easeTo({
      center: [recording.lng, recording.lat],
      zoom: Math.max(state.map.getZoom(), 7),
      duration: 1000,
    });
  }
}

function stopPlayback() {
  elements.audio.pause();
  elements.audio.removeAttribute("src");
  elements.audio.load();
  state.selectedRecording = null;
  elements.player.classList.add("hidden");
  elements.trackOverlay.classList.add("hidden");
  elements.playerProgress.value = "0";
  elements.playerCurrent.textContent = "0:00";
  elements.playerDuration.textContent = "0:00";
  updateSelectedRecordingMarker();
  syncResultSelection();
  showPlayingState(false);
}

/**
 * @param {string} label
 * @param {string} value
 * @param {boolean} [raw]
 */
function detailRow(label, value, raw = false) {
  return `
    <div class="detail-row">
      <span class="detail-label">${esc(label)}</span>
      <div class="detail-value">${raw ? value : esc(value)}</div>
    </div>
  `;
}

/**
 * @param {Recording} recording
 */
function showTrackOverlay(recording) {
  elements.overlayTitle.textContent = recording.title || "Untitled";

  const rows = [];
  rows.push(detailRow("Provider", recording.provider || "Unknown"));
  if (recording.species) {
    rows.push(detailRow("Species", recording.species));
  }
  if (recording.duration_sec != null) {
    rows.push(detailRow("Duration", formatDuration(recording.duration_sec)));
  }
  if (recording.recorded_at) {
    rows.push(detailRow("Recorded", formatRecordedDate(recording.recorded_at)));
  }
  if (recording.license) {
    rows.push(detailRow("License", recording.license));
  }
  if (recording.lat != null && recording.lng != null) {
    rows.push(
      detailRow(
        "Map",
        `${formatCoordinates(recording.lat, recording.lng)}${recording.inferred_geo ? " / inferred from tags" : ""}`,
      ),
    );
  }
  if (recording.tags?.length) {
    const overlayTags = normalizeTags(recording.tags).slice(0, 8);
    rows.push(
      detailRow(
        "Tags",
        `<div class="tag-list-inline">${overlayTags
          .map((tag) => `<span class="tag-pill">${esc(tag)}</span>`)
          .join("")}</div>`,
        true,
      ),
    );
  }

  const rating = getRating(recording.id);
  const starButtons = Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    const active = value <= rating;
    return `<button type="button" class="star-button" data-star="${value}" aria-label="Rate ${value} star${value > 1 ? "s" : ""}">${
      active ? "★" : "☆"
    }</button>`;
  }).join("");

  rows.push(detailRow("Rating", starButtons, true));
  elements.overlayDetails.innerHTML = rows.join("");
  elements.trackOverlay.classList.remove("hidden");

  elements.overlayDetails.querySelectorAll(".star-button").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", () => {
      const stars = Number(button.dataset.star);
      setRating(recording.id, stars);
      showTrackOverlay(recording);
      const strip = elements.resultsList.querySelector(
        `.result-card[data-id="${escapeSelector(recording.id)}"] .rating-strip`,
      );
      if (strip) {
        strip.textContent = ratingMarkup(recording.id);
      }
    });
  });
}

/**
 * @param {Recording} recording
 */
function findSimilar(recording) {
  const terms = [];
  if (recording.species) {
    terms.push(recording.species);
  }
  if (recording.tags?.length) {
    terms.push(...recording.tags.slice(0, 3));
  }
  if (!terms.length && recording.title) {
    terms.push(recording.title.split(/[\u2014\-()]/)[0].trim());
  }

  elements.searchInput.value = terms.join(" ");
  elements.trackOverlay.classList.add("hidden");
  clearSceneSelection();
  setPanelOpen(true);
  renderActiveFilters();
  void doSearch();
}

/**
 * @param {Recording[]} recordings
 */
function renderResults(recordings) {
  if (!recordings.length) {
    elements.resultsList.innerHTML = "";
    setEmptyState("No recordings matched this mix.", "Try a wider radius, fewer type filters, or a looser keyword phrase.");
    return;
  }

  elements.resultsEmpty.classList.add("hidden");
  elements.resultsList.innerHTML = recordings
    .map((recording) => {
      const tags = normalizeTags(recording.tags).slice(0, 5);
      const meta = [
        `<span class="provider-pill">${esc(recording.provider || "unknown")}</span>`,
        `<span class="meta-pill">${esc(describeGeo(recording))}</span>`,
      ];

      if (recording.species) {
        meta.push(`<span class="meta-pill">${esc(recording.species)}</span>`);
      }
      if (recording.recorded_at) {
        meta.push(`<span class="meta-pill">${esc(formatRecordedDate(recording.recorded_at))}</span>`);
      }

      return `
        <article class="result-card${recording.id === state.selectedRecording?.id ? " is-active" : ""}" data-id="${esc(recording.id)}">
          <div class="result-card-shell">
            <div class="result-card-top">
              <div class="result-title-wrap">
                <h3 class="result-title">${esc(recording.title || "Untitled")}</h3>
                <p class="result-subtitle">${esc(
                  recording.lat != null && recording.lng != null
                    ? formatCoordinates(recording.lat, recording.lng)
                    : "Mapped from tags when possible",
                )}</p>
              </div>
              <span class="duration-pill">${esc(formatDuration(recording.duration_sec || 0))}</span>
            </div>
            <div class="result-card-meta">${meta.join("")}</div>
            ${tags.length ? `<div class="tag-list">${tags.map((tag) => `<span class="tag-pill">${esc(tag)}</span>`).join("")}</div>` : ""}
            <div class="result-footer">
              <div class="rating-strip">${ratingMarkup(recording.id)}</div>
              <div class="result-actions">
                <button type="button" class="result-action secondary" data-action="similar" data-id="${esc(recording.id)}">Find Similar</button>
                <button type="button" class="result-action primary" data-action="play" data-id="${esc(recording.id)}">Play</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

/**
 * @param {{ total?: number, providers_queried?: string[], providers_failed?: string[] }} data
 */
function renderResultsHeader(data) {
  const total = Number(data.total ?? state.recordings.length);
  const providersQueried = Array.isArray(data.providers_queried) ? data.providers_queried.length : 0;
  const failed = Array.isArray(data.providers_failed) ? data.providers_failed : [];
  const parts = [
    `<strong>${total}</strong> results`,
    providersQueried ? `from <strong>${providersQueried}</strong> providers` : "",
  ].filter(Boolean);

  elements.resultsHeader.innerHTML = `
    ${parts.join(" ")}
    ${failed.length ? `<div class="failures">Provider issues: ${esc(failed.join(", "))}</div>` : ""}
  `;
  elements.resultCountStat.textContent = total > 0 ? `${total} hits` : "No hits";
}

/**
 * @param {Recording} recording
 * @param {[number, number]} coordinates
 */
function showPopup(recording, coordinates) {
  if (!state.mapReady) {
    return;
  }

  if (state.popup) {
    state.popup.remove();
  }

  const popupRoot = document.createElement("div");
  popupRoot.innerHTML = `
    <div class="popup-title">${esc(recording.title || "Untitled")}</div>
    <div class="popup-meta">
      ${esc(recording.provider || "Unknown")}
      ${recording.species ? ` / ${esc(recording.species)}` : ""}
      ${recording.duration_sec ? ` / ${esc(formatDuration(recording.duration_sec))}` : ""}
    </div>
    ${
      recording.tags?.length
        ? `<div class="popup-tags">${normalizeTags(recording.tags)
            .slice(0, 4)
            .map((tag) => `<span class="tag-pill">${esc(tag)}</span>`)
            .join("")}</div>`
        : ""
    }
    <div class="popup-actions">
      <button type="button" class="popup-action secondary" data-popup-action="similar">Find Similar</button>
      <button type="button" class="popup-action primary" data-popup-action="play">Play</button>
    </div>
  `;

  const playButton = popupRoot.querySelector('[data-popup-action="play"]');
  const similarButton = popupRoot.querySelector('[data-popup-action="similar"]');

  if (playButton instanceof HTMLButtonElement) {
    playButton.addEventListener("click", () => {
      playRecording(recording);
      state.popup?.remove();
    });
  }

  if (similarButton instanceof HTMLButtonElement) {
    similarButton.addEventListener("click", () => {
      findSimilar(recording);
      state.popup?.remove();
    });
  }

  state.popup = new maplibregl.Popup({
    closeButton: true,
    closeOnMove: false,
    offset: 16,
    maxWidth: "320px",
  })
    .setLngLat(coordinates)
    .setDOMContent(popupRoot)
    .addTo(state.map);

  state.popup.on("close", () => {
    state.popup = null;
  });
}

async function resolveLocationInputIfNeeded() {
  const locationText = elements.locationInput.value.trim();
  if (!locationText || state.searchLat != null || state.searchLng != null) {
    return false;
  }

  const place = await geocode(locationText);
  if (!place) {
    return false;
  }

  setSearchLocation(place.lat, place.lng, place.name);
  return true;
}

async function doSearch() {
  const searchText = elements.searchInput.value.trim();
  const locationText = elements.locationInput.value.trim();
  const activeTypes = readActiveTypes();
  let controller = null;

  elements.resultsError.classList.add("hidden");
  elements.resultsError.textContent = "";
  elements.resultsEmpty.classList.add("hidden");
  renderActiveFilters();

  if (state.popup) {
    state.popup.remove();
    state.popup = null;
  }

  try {
    if (locationText && state.searchLat == null && state.searchLng == null) {
      try {
        await resolveLocationInputIfNeeded();
      } catch (error) {
        elements.locationHint.textContent = `Could not geocode place: ${errorMessage(error)}`;
      }
    }

    const params = buildSearchParams({
      searchText,
      locationText,
      activeTypes,
      searchLat: state.searchLat,
      searchLng: state.searchLng,
      searchRadius: state.searchRadius,
      minDuration: state.minDuration,
    });

    if (!hasSearchIntent(params)) {
      setEmptyState("Choose a direction first.", "Enter keywords, pick a scene chip, or drop a map pin before searching.");
      return;
    }

    if (state.searchAbortController) {
      state.searchAbortController.abort();
    }

    controller = new AbortController();
    state.searchAbortController = controller;
    setSearchBusy(true);

    const data = await searchRecordings(params, controller.signal);
    state.recordings = Array.isArray(data.recordings) ? data.recordings.map(normalizeRecording) : [];
    state.recordingsById = new Map(state.recordings.map((recording) => [recording.id, recording]));

    renderResultsHeader(data);
    renderResults(state.recordings);
    updateRecordingSource(state.recordings);
    fitMapToRecordings(state.recordings);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    elements.resultsError.textContent = `Search failed: ${errorMessage(error)}`;
    elements.resultsError.classList.remove("hidden");
    setEmptyState("The search did not complete.", "Check the API endpoint or try a broader query.");
  } finally {
    setSearchBusy(false);
    if (state.searchAbortController === controller) {
      state.searchAbortController = null;
    }
  }
}

async function loadMeta() {
  renderTypeChips();

  const [providerResult, categoryResult] = await Promise.allSettled([
    fetchProviders(),
    fetchCategories(),
  ]);

  if (providerResult.status === "fulfilled") {
    state.providers = providerResult.value;
    elements.providerCount.textContent = String(providerResult.value.length);
  }

  if (categoryResult.status === "fulfilled" && Array.isArray(categoryResult.value) && categoryResult.value.length) {
    state.categories = categoryResult.value;
    renderTypeChips();
  }
}

// Upload flow

function openUploadModal() {
  elements.uploadModal.classList.remove("hidden");
  elements.uploadModal.setAttribute("aria-hidden", "false");

  if (!elements.uploadDate.value) {
    elements.uploadDate.value = new Date().toISOString().slice(0, 10);
  }

  if (!state.uploadMap) {
    setTimeout(() => {
      state.uploadMap = new maplibregl.Map({
        container: "upload-map",
        style: buildMapStyle(),
        center: [-63.5752, 44.6488],
        zoom: 4,
        attributionControl: false,
      });

      state.uploadMap.on("click", /** @param {any} event */ (event) => {
        elements.uploadLat.value = event.lngLat.lat.toFixed(5);
        elements.uploadLng.value = event.lngLat.lng.toFixed(5);
        updateUploadMarker(event.lngLat.lat, event.lngLat.lng, false);
      });
    }, 40);
  } else {
    setTimeout(() => state.uploadMap.resize(), 40);
  }
}

function closeUploadModal() {
  elements.uploadModal.classList.add("hidden");
  elements.uploadModal.setAttribute("aria-hidden", "true");
  elements.uploadProgress.classList.add("hidden");
  elements.uploadSubmit.disabled = false;
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {boolean} [fly]
 */
function updateUploadMarker(lat, lng, fly = true) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !state.uploadMap) {
    return;
  }

  if (!state.uploadMarker) {
    state.uploadMarker = new maplibregl.Marker({ color: "#80e7bf" });
  }

  state.uploadMarker.setLngLat([longitude, latitude]).addTo(state.uploadMap);
  if (fly) {
    state.uploadMap.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(state.uploadMap.getZoom(), 11),
    });
  }
}

function clearUploadLocation() {
  elements.uploadLat.value = "";
  elements.uploadLng.value = "";
  if (state.uploadMarker) {
    state.uploadMarker.remove();
    state.uploadMarker = null;
  }
}

/**
 * @param {SubmitEvent} event
 */
async function submitUpload(event) {
  event.preventDefault();
  const file = elements.uploadFile.files?.[0];
  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("audio", file);
  formData.append("title", elements.uploadTitle.value || file.name.replace(/\.[^.]+$/, ""));
  formData.append("species", elements.uploadSpecies.value);
  formData.append("tags", elements.uploadTags.value);
  formData.append("notes", elements.uploadNotes.value);
  formData.append("recorded_at", elements.uploadDate.value);
  if (elements.uploadLat.value) {
    formData.append("lat", elements.uploadLat.value);
  }
  if (elements.uploadLng.value) {
    formData.append("lng", elements.uploadLng.value);
  }

  elements.uploadProgress.classList.remove("hidden");
  elements.uploadProgress.classList.remove("status-error");
  const progressLabel = elements.uploadProgress.querySelector("span");
  if (progressLabel) {
    progressLabel.textContent = "Uploading your recording...";
  }
  elements.uploadSubmit.disabled = true;

  try {
    const data = await uploadRecording(formData);
    if (!data.ok) {
      throw new Error(data.error || "Upload failed");
    }

    closeUploadModal();
    elements.uploadForm.reset();
    clearUploadLocation();
    elements.uploadFileMeta.textContent = "MP3, WAV, M4A, or any browser-supported audio file.";
    window.alert("Upload successful. Your recording is now available through the API search index.");
  } catch (error) {
    elements.uploadProgress.classList.remove("hidden");
    elements.uploadProgress.classList.add("status-error");
    if (progressLabel) {
      progressLabel.textContent = `Upload failed: ${errorMessage(error)}`;
    }
  } finally {
    elements.uploadSubmit.disabled = false;
  }
}

function resetFilters() {
  if (state.searchAbortController) {
    state.searchAbortController.abort();
    state.searchAbortController = null;
  }

  setSearchBusy(false);
  elements.searchInput.value = "";
  elements.locationInput.value = "";
  clearLocation();
  setActiveTypes([]);
  setDuration(60);
  clearSceneSelection();
  elements.resultsError.classList.add("hidden");

  if (state.popup) {
    state.popup.remove();
    state.popup = null;
  }

  clearResults();
  stopPlayback();
  setEmptyState("Filters reset.", "Pick a new scene, type a query, or drop a new pin to search again.");
  renderActiveFilters();
}

// Event wiring

function bindEvents() {
  elements.panelToggle.addEventListener("click", () => setPanelOpen(!state.panelOpen));
  elements.panelClose.addEventListener("click", () => setPanelOpen(false));
  elements.searchBtn.addEventListener("click", () => {
    clearSceneSelection();
    void doSearch();
  });

  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearSceneSelection();
      void doSearch();
    }
  });

  elements.searchInput.addEventListener("input", () => {
    clearSceneSelection();
    renderActiveFilters();
  });

  elements.locationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      elements.geocodeBtn.click();
    }
  });

  elements.locationInput.addEventListener("input", () => {
    if (state.searchLat != null || state.searchLng != null) {
      clearLocation({ resetInput: false });
    } else {
      renderActiveFilters();
    }
    elements.locationHint.textContent = "Use Locate or Search to geocode this place.";
  });

  elements.geocodeBtn.addEventListener("click", async () => {
    const query = elements.locationInput.value.trim();
    if (!query) {
      return;
    }

    try {
      const place = await geocode(query);
      if (!place) {
        elements.locationHint.textContent = "Place not found. Try a different name.";
        return;
      }
      setSearchLocation(place.lat, place.lng, place.name);
    } catch (error) {
      elements.locationHint.textContent = `Geocode failed: ${errorMessage(error)}`;
    }
  });

  elements.useCurrentLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
      elements.locationHint.textContent = "Geolocation is not available in this browser.";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchLocation(position.coords.latitude, position.coords.longitude, "Current location");
      },
      (error) => {
        elements.locationHint.textContent = `Location failed: ${error.message}`;
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  elements.clearLocation.addEventListener("click", () => clearLocation());
  elements.radiusSlider.addEventListener("input", () => {
    state.searchRadius = Number(elements.radiusSlider.value);
    updateRadiusUI();
    updateRadiusCircle();
    renderActiveFilters();
  });

  elements.sceneChips.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const chip = target.closest(".scene-chip");
    if (!(chip instanceof HTMLButtonElement)) {
      return;
    }

    toggleScene(chip);
    const scene = JSON.parse(chip.dataset.scene || "{}");
    elements.searchInput.value = scene.q || "";
    setDuration(scene.min_duration ? Number(scene.min_duration) : 60);
    setActiveTypes([]);
    clearLocation();
    renderActiveFilters();
    void doSearch();
  });

  elements.typeChips.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const chip = target.closest(".chip");
    if (!(chip instanceof HTMLElement)) {
      return;
    }

    chip.classList.toggle("active");
    clearSceneSelection();
    renderActiveFilters();
  });

  elements.durationChips.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const chip = target.closest(".chip");
    if (!(chip instanceof HTMLElement)) {
      return;
    }

    clearSceneSelection();
    setDuration(Number(chip.dataset.duration));
  });

  elements.clearFilters.addEventListener("click", resetFilters);

  elements.resultsList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const action = target.closest("[data-action]");
    const card = target.closest(".result-card");
    const id = (action instanceof HTMLElement ? action.dataset.id : undefined)
      || (card instanceof HTMLElement ? card.dataset.id : undefined);

    if (!id) {
      return;
    }

    const recording = state.recordingsById.get(id);
    if (!recording) {
      return;
    }

    if (action instanceof HTMLElement && action.dataset.action === "similar") {
      findSimilar(recording);
      return;
    }

    playRecording(recording);
  });

  elements.overlayClose.addEventListener("click", () => elements.trackOverlay.classList.add("hidden"));
  elements.overlaySimilar.addEventListener("click", () => {
    if (state.selectedRecording) {
      findSimilar(state.selectedRecording);
    }
  });

  elements.playPauseBtn.addEventListener("click", () => {
    if (!elements.audio.src) {
      return;
    }
    if (elements.audio.paused) {
      void elements.audio.play();
    } else {
      elements.audio.pause();
    }
  });

  elements.playerClose.addEventListener("click", stopPlayback);

  elements.audio.addEventListener("play", () => showPlayingState(true));
  elements.audio.addEventListener("pause", () => showPlayingState(false));
  elements.audio.addEventListener("ended", () => showPlayingState(false));
  elements.audio.addEventListener("loadedmetadata", () => {
    elements.playerDuration.textContent = formatDuration(elements.audio.duration);
  });
  elements.audio.addEventListener("timeupdate", () => {
    if (!elements.audio.duration) {
      return;
    }
    elements.playerProgress.value = String((elements.audio.currentTime / elements.audio.duration) * 100);
    elements.playerCurrent.textContent = formatDuration(elements.audio.currentTime);
    elements.playerDuration.textContent = formatDuration(elements.audio.duration);
  });
  elements.audio.addEventListener("error", () => {
    elements.resultsError.textContent = "Playback failed for this recording.";
    elements.resultsError.classList.remove("hidden");
  });
  elements.playerProgress.addEventListener("input", () => {
    if (!elements.audio.duration) {
      return;
    }
    elements.audio.currentTime = (Number(elements.playerProgress.value) / 100) * elements.audio.duration;
  });

  elements.uploadOpen.addEventListener("click", openUploadModal);
  elements.uploadClose.addEventListener("click", closeUploadModal);
  elements.uploadBackdrop.addEventListener("click", closeUploadModal);
  elements.uploadCancel.addEventListener("click", closeUploadModal);
  elements.uploadForm.addEventListener("submit", (event) => {
    void submitUpload(/** @type {SubmitEvent} */ (event));
  });

  elements.uploadFile.addEventListener("change", () => {
    const file = elements.uploadFile.files?.[0];
    if (!file) {
      elements.uploadFileMeta.textContent = "MP3, WAV, M4A, or any browser-supported audio file.";
      return;
    }

    elements.uploadFileMeta.textContent = `${file.name} / ${bytesToHuman(file.size)}`;
    if (!elements.uploadTitle.value) {
      elements.uploadTitle.value = file.name.replace(/\.[^.]+$/, "");
    }
  });

  elements.uploadGps.addEventListener("click", () => {
    if (!navigator.geolocation) {
      window.alert("Geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        elements.uploadLat.value = position.coords.latitude.toFixed(5);
        elements.uploadLng.value = position.coords.longitude.toFixed(5);
        updateUploadMarker(position.coords.latitude, position.coords.longitude, true);
      },
      (error) => window.alert(`GPS failed: ${error.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  elements.uploadClearLocation.addEventListener("click", clearUploadLocation);
  [elements.uploadLat, elements.uploadLng].forEach((input) => {
    input.addEventListener("change", () => {
      const lat = Number(elements.uploadLat.value);
      const lng = Number(elements.uploadLng.value);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updateUploadMarker(lat, lng, true);
      }
    });
  });

  window.addEventListener("resize", () => {
    state.map?.resize();
    state.uploadMap?.resize();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!elements.uploadModal.classList.contains("hidden")) {
      closeUploadModal();
      return;
    }

    if (!elements.trackOverlay.classList.contains("hidden")) {
      elements.trackOverlay.classList.add("hidden");
      return;
    }

    if (window.innerWidth <= 820 && state.panelOpen) {
      setPanelOpen(false);
    }
  });
}

function boot() {
  updateRadiusUI();
  setPanelOpen(state.panelOpen);
  setDuration(state.minDuration);
  renderTypeChips();
  renderActiveFilters();
  setEmptyState(
    "Start with a scene chip or set a map pin.",
    "Searches can use keywords, types, minimum duration, or a radius around the point you drop on the map.",
  );
  initMap();
  bindEvents();
  void loadMeta();
}

boot();
