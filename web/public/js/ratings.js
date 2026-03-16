// @ts-check

const RATINGS_KEY = "field-recorder-ratings";

export function getRatings() {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * @param {string} id
 */
export function getRating(id) {
  return getRatings()[id] || 0;
}

/**
 * @param {string} id
 * @param {number} stars
 */
export function setRating(id, stars) {
  const ratings = getRatings();
  ratings[id] = stars;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
}

/**
 * @param {string} id
 */
export function ratingMarkup(id) {
  const rating = getRating(id);
  return rating > 0 ? "★".repeat(rating) : "";
}
