import SwiftUI
import MapKit

@Observable
final class AppState {
    // Search
    var searchQuery = SearchQuery()
    var searchText = ""
    var locationText = ""
    var activeTypes: Set<String> = []

    // Results
    var results: [Recording] = []
    var totalResults = 0
    var providersQueried: [String] = []
    var providersFailed: [String] = []
    var isSearching = false
    var searchError: String?

    // Map
    var mapPosition = MapCameraPosition.automatic
    var searchPin: CLLocationCoordinate2D?

    // Selection
    var selectedRecording: Recording?
    var showTrackDetail = false
    var showUpload = false
    var showSearchPanel = true

    // Services
    let player = AudioPlayer()
    let locationManager = LocationManager()
    let api = APIClient.shared

    // Ratings
    private let ratingsKey = "fr-ratings"

    func rating(for id: String) -> Int {
        let dict = UserDefaults.standard.dictionary(forKey: ratingsKey) as? [String: Int] ?? [:]
        return dict[id] ?? 0
    }

    func setRating(_ stars: Int, for id: String) {
        var dict = UserDefaults.standard.dictionary(forKey: ratingsKey) as? [String: Int] ?? [:]
        dict[id] = stars
        UserDefaults.standard.set(dict, forKey: ratingsKey)
    }

    // Categories
    static let typeCategories = [
        "nature", "birds", "mammals", "amphibians", "insects",
        "fish", "ocean", "forest", "river", "desert",
        "weather", "urban", "cultural", "folk", "language"
    ]

    static let durationOptions: [(String, Int)] = [
        ("Any", 0), ("1+ min", 60), ("5+ min", 300),
        ("10+ min", 600), ("30+ min", 1800)
    ]

    func search() async {
        isSearching = true
        searchError = nil

        var query = searchQuery
        query.q = searchText
        if !activeTypes.isEmpty {
            query.type = activeTypes.joined(separator: ",")
        }
        if let pin = searchPin {
            query.lat = pin.latitude
            query.lng = pin.longitude
        }

        do {
            let result = try await api.search(query)
            results = result.recordings
            totalResults = result.total
            providersQueried = result.providers_queried
            providersFailed = result.providers_failed

            // Fit map to results
            let coords = results.compactMap(\.coordinate)
            if !coords.isEmpty {
                let region = regionFitting(coords)
                mapPosition = .region(region)
            }
        } catch {
            searchError = error.localizedDescription
        }

        isSearching = false
    }

    func applyScene(_ scene: CuratedScene) {
        searchText = scene.query
        searchQuery.minDuration = scene.minDuration
        activeTypes.removeAll()
        searchPin = nil
        Task { await search() }
    }

    func findSimilar(to recording: Recording) {
        var terms: [String] = []
        if let species = recording.species { terms.append(species) }
        terms.append(contentsOf: recording.tags.prefix(3))
        searchText = terms.joined(separator: " ")
        showTrackDetail = false
        Task { await search() }
    }

    func playRecording(_ recording: Recording) {
        player.play(recording)
        selectedRecording = recording
    }

    private func regionFitting(_ coords: [CLLocationCoordinate2D]) -> MKCoordinateRegion {
        var minLat = coords[0].latitude, maxLat = coords[0].latitude
        var minLng = coords[0].longitude, maxLng = coords[0].longitude
        for c in coords {
            minLat = min(minLat, c.latitude)
            maxLat = max(maxLat, c.latitude)
            minLng = min(minLng, c.longitude)
            maxLng = max(maxLng, c.longitude)
        }
        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )
        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.3, 0.5),
            longitudeDelta: max((maxLng - minLng) * 1.3, 0.5)
        )
        return MKCoordinateRegion(center: center, span: span)
    }
}
