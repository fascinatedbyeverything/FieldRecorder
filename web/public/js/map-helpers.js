// @ts-check

export function buildMapStyle() {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri",
        maxzoom: 22,
      },
      labels: {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 22,
      },
    },
    layers: [
      { id: "satellite", type: "raster", source: "satellite" },
      { id: "labels", type: "raster", source: "labels", minzoom: 3 },
    ],
  };
}

export function emptyFeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 */
export function createRadiusGeoJSON(lat, lng, radiusKm) {
  const points = 72;
  const coords = [];
  const earthRadiusKm = 6371;

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * 2 * Math.PI;
    const dLat = (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle);
    const dLng =
      (radiusKm / earthRadiusKm) *
      (180 / Math.PI) *
      (Math.sin(angle) / Math.cos((lat * Math.PI) / 180));
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    ],
  };
}
