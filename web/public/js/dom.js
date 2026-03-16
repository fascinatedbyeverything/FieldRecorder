// @ts-check

/**
 * @param {string} selector
 */
function requireElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

export const elements = {
  panel: /** @type {HTMLElement} */ (requireElement("#panel")),
  panelToggle: /** @type {HTMLButtonElement} */ (requireElement("#panel-toggle")),
  panelClose: /** @type {HTMLButtonElement} */ (requireElement("#panel-close")),
  providerCount: /** @type {HTMLElement} */ (requireElement("#provider-count")),
  radiusValue: /** @type {HTMLElement} */ (requireElement("#radius-value")),
  radiusReadout: /** @type {HTMLElement} */ (requireElement("#radius-readout")),
  resultCountStat: /** @type {HTMLElement} */ (requireElement("#result-count-stat")),
  searchInput: /** @type {HTMLInputElement} */ (requireElement("#search-input")),
  searchBtn: /** @type {HTMLButtonElement} */ (requireElement("#search-btn")),
  activeFilters: /** @type {HTMLElement} */ (requireElement("#active-filters")),
  locationInput: /** @type {HTMLInputElement} */ (requireElement("#location-input")),
  geocodeBtn: /** @type {HTMLButtonElement} */ (requireElement("#geocode-btn")),
  useCurrentLocation: /** @type {HTMLButtonElement} */ (requireElement("#use-current-location")),
  clearLocation: /** @type {HTMLButtonElement} */ (requireElement("#clear-location")),
  radiusSlider: /** @type {HTMLInputElement} */ (requireElement("#radius-slider")),
  locationHint: /** @type {HTMLElement} */ (requireElement("#location-hint")),
  sceneChips: /** @type {HTMLElement} */ (requireElement("#scene-chips")),
  typeChips: /** @type {HTMLElement} */ (requireElement("#type-chips")),
  durationChips: /** @type {HTMLElement} */ (requireElement("#duration-chips")),
  clearFilters: /** @type {HTMLButtonElement} */ (requireElement("#clear-filters")),
  resultsHeader: /** @type {HTMLElement} */ (requireElement("#results-header")),
  resultsLoading: /** @type {HTMLElement} */ (requireElement("#results-loading")),
  resultsError: /** @type {HTMLElement} */ (requireElement("#results-error")),
  resultsEmpty: /** @type {HTMLElement} */ (requireElement("#results-empty")),
  resultsList: /** @type {HTMLElement} */ (requireElement("#results-list")),
  player: /** @type {HTMLElement} */ (requireElement("#player")),
  playerTitle: /** @type {HTMLElement} */ (requireElement("#player-title")),
  playerProvider: /** @type {HTMLElement} */ (requireElement("#player-provider")),
  playerProgress: /** @type {HTMLInputElement} */ (requireElement("#player-progress")),
  playerCurrent: /** @type {HTMLElement} */ (requireElement("#player-current")),
  playerDuration: /** @type {HTMLElement} */ (requireElement("#player-duration")),
  playPauseBtn: /** @type {HTMLButtonElement} */ (requireElement("#play-pause-btn")),
  playIcon: /** @type {SVGElement} */ (requireElement("#play-icon")),
  pauseIcon: /** @type {SVGElement} */ (requireElement("#pause-icon")),
  playerClose: /** @type {HTMLButtonElement} */ (requireElement("#player-close")),
  audio: /** @type {HTMLAudioElement} */ (requireElement("#audio")),
  trackOverlay: /** @type {HTMLElement} */ (requireElement("#track-overlay")),
  overlayTitle: /** @type {HTMLElement} */ (requireElement("#overlay-title")),
  overlayDetails: /** @type {HTMLElement} */ (requireElement("#overlay-details")),
  overlayClose: /** @type {HTMLButtonElement} */ (requireElement("#overlay-close")),
  overlaySimilar: /** @type {HTMLButtonElement} */ (requireElement("#overlay-similar")),
  uploadModal: /** @type {HTMLElement} */ (requireElement("#upload-modal")),
  uploadBackdrop: /** @type {HTMLElement} */ (requireElement("#upload-backdrop")),
  uploadOpen: /** @type {HTMLButtonElement} */ (requireElement("#upload-open")),
  uploadClose: /** @type {HTMLButtonElement} */ (requireElement("#upload-close")),
  uploadCancel: /** @type {HTMLButtonElement} */ (requireElement("#upload-cancel")),
  uploadForm: /** @type {HTMLFormElement} */ (requireElement("#upload-form")),
  uploadFile: /** @type {HTMLInputElement} */ (requireElement("#upload-file")),
  uploadFileMeta: /** @type {HTMLElement} */ (requireElement("#upload-file-meta")),
  uploadTitle: /** @type {HTMLInputElement} */ (requireElement("#upload-title")),
  uploadSpecies: /** @type {HTMLInputElement} */ (requireElement("#upload-species")),
  uploadTags: /** @type {HTMLInputElement} */ (requireElement("#upload-tags")),
  uploadNotes: /** @type {HTMLTextAreaElement} */ (requireElement("#upload-notes")),
  uploadDate: /** @type {HTMLInputElement} */ (requireElement("#upload-date")),
  uploadLat: /** @type {HTMLInputElement} */ (requireElement("#upload-lat")),
  uploadLng: /** @type {HTMLInputElement} */ (requireElement("#upload-lng")),
  uploadGps: /** @type {HTMLButtonElement} */ (requireElement("#upload-gps")),
  uploadClearLocation: /** @type {HTMLButtonElement} */ (requireElement("#upload-clear-location")),
  uploadProgress: /** @type {HTMLElement} */ (requireElement("#upload-progress")),
  uploadSubmit: /** @type {HTMLButtonElement} */ (requireElement("#upload-submit")),
};
